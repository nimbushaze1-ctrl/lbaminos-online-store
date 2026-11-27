<?php
/**
 * One-click store setup. Safe to run more than once: it updates what it created before.
 */
defined( 'ABSPATH' ) || exit;

add_action( 'admin_post_lba_setup', function () {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Not allowed.' );
	}
	check_admin_referer( 'lba_setup' );
	$msg = lba_run_setup();
	wp_safe_redirect( add_query_arg( 'lba_setup', rawurlencode( $msg ), admin_url( 'admin.php?page=lb-aminos' ) ) );
	exit;
} );

/** Runs every setup step and returns a one-line summary. */
function lba_run_setup() {
	@set_time_limit( 300 ); // phpcs:ignore
	$parts = array();
	$pages = lba_setup_pages();
	$parts[] = $pages . ' pages';
	if ( class_exists( 'WooCommerce' ) ) {
		lba_setup_woo_options();
		$parts[] = lba_setup_products() . ' products';
		lba_setup_shipping();
		lba_setup_gateways();
	}
	lba_setup_menu();
	update_option( 'lba_setup_done', current_time( 'M j, Y g:i a' ) );
	delete_option( 'lba_needs_setup' );
	flush_rewrite_rules();
	return 'Created or updated ' . implode( ', ', $parts ) . '.';
}

/* ---------- Pages ---------- */

function lba_upsert_page( $slug, $title, $content, $parent = 0 ) {
	$existing = get_page_by_path( $slug );
	if ( $existing ) {
		// Only refresh pages we created and the owner hasn't edited.
		if ( get_post_meta( $existing->ID, '_lba_page', true ) && get_post_meta( $existing->ID, '_lba_hash', true ) === md5( $existing->post_content ) ) {
			wp_update_post( array( 'ID' => $existing->ID, 'post_content' => $content, 'post_title' => $title ) );
			update_post_meta( $existing->ID, '_lba_hash', md5( get_post_field( 'post_content', $existing->ID, 'raw' ) ) );
		}
		return $existing->ID;
	}
	$id = wp_insert_post( array(
		'post_type'    => 'page',
		'post_status'  => 'publish',
		'post_name'    => $slug,
		'post_title'   => $title,
		'post_content' => $content,
		'post_parent'  => $parent,
	) );
	if ( $id && ! is_wp_error( $id ) ) {
		update_post_meta( $id, '_lba_page', 1 );
		update_post_meta( $id, '_lba_hash', md5( get_post_field( 'post_content', $id, 'raw' ) ) );
	}
	return $id;
}

function lba_setup_pages() {
	$data  = json_decode( file_get_contents( LBA_DIR . 'data/pages.json' ), true ); // phpcs:ignore
	$count = 0;
	foreach ( $data['pages'] as $p ) {
		$html = str_replace( 'href="/coa"', 'href="' . esc_url( home_url( '/coa/' ) ) . '"', $p['html'] );
		$html = preg_replace( '#<p class="small muted">(.*?)</p>#', '<p class="lba-note">$1</p>', $html );
		lba_upsert_page( $p['slug'], $p['title'], "<!-- wp:html -->\n" . $html . "\n<!-- /wp:html -->" );
		$count++;
	}
	lba_upsert_page( 'contact', 'Contact', '[lba_contact]' );
	lba_upsert_page( 'local-pickup', 'Local pickup', '[lba_pickup]' );
	lba_upsert_page( 'coa', 'Lab reports', '[lba_coa]' );
	$count += 3;

	$home = lba_upsert_page( 'home', 'Home', '' );
	update_option( 'show_on_front', 'page' );
	update_option( 'page_on_front', $home );

	$privacy = get_page_by_path( 'privacy' );
	if ( $privacy ) {
		update_option( 'wp_page_for_privacy_policy', $privacy->ID );
	}
	return $count;
}

/* ---------- WooCommerce basics ---------- */

function lba_setup_woo_options() {
	update_option( 'woocommerce_currency', 'USD' );
	update_option( 'woocommerce_default_country', 'US:CA' );
	update_option( 'woocommerce_store_city', 'Long Beach' );
	update_option( 'woocommerce_store_postcode', '90802' );
	update_option( 'woocommerce_allowed_countries', 'specific' );
	update_option( 'woocommerce_specific_allowed_countries', array( 'US' ) );
	update_option( 'woocommerce_ship_to_countries', '' );
	update_option( 'woocommerce_enable_guest_checkout', 'yes' );
	update_option( 'woocommerce_enable_coupons', 'yes' );
	update_option( 'woocommerce_calc_taxes', 'no' );
	update_option( 'woocommerce_enable_reviews', 'no' );
	update_option( 'woocommerce_manage_stock', 'no' );
	update_option( 'woocommerce_coming_soon', 'no' );
	update_option( 'woocommerce_store_pages_only', 'no' );

	// Make sure the shop, cart, checkout and account pages exist.
	if ( class_exists( 'WC_Install' ) ) {
		WC_Install::create_pages();
	}
	// Use the classic cart and checkout so our payment options and research-use checkbox appear.
	foreach ( array( 'cart' => '[woocommerce_cart]', 'checkout' => '[woocommerce_checkout]' ) as $key => $shortcode ) {
		$pid = wc_get_page_id( $key );
		if ( $pid > 0 ) {
			wp_update_post( array( 'ID' => $pid, 'post_content' => '<!-- wp:shortcode -->' . $shortcode . '<!-- /wp:shortcode -->' ) );
		}
	}
	$terms = get_page_by_path( 'terms' );
	if ( $terms ) {
		update_option( 'woocommerce_terms_page_id', $terms->ID );
	}
}

/* ---------- Products ---------- */

function lba_import_image( $file ) {
	$found = get_posts( array(
		'post_type'   => 'attachment',
		'meta_key'    => '_lba_src', // phpcs:ignore
		'meta_value'  => $file, // phpcs:ignore
		'numberposts' => 1,
		'fields'      => 'ids',
	) );
	if ( $found ) {
		return (int) $found[0];
	}
	$path = LBA_DIR . 'data/images/' . $file;
	if ( ! file_exists( $path ) ) {
		return 0;
	}
	$upload = wp_upload_bits( strtolower( $file ), null, file_get_contents( $path ) ); // phpcs:ignore
	if ( ! empty( $upload['error'] ) ) {
		return 0;
	}
	require_once ABSPATH . 'wp-admin/includes/image.php';
	$id = wp_insert_attachment( array(
		'post_mime_type' => 'image/jpeg',
		'post_title'     => preg_replace( '/\.jpg$/', '', $file ),
		'post_status'    => 'inherit',
	), $upload['file'] );
	if ( ! $id || is_wp_error( $id ) ) {
		return 0;
	}
	wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $upload['file'] ) );
	update_post_meta( $id, '_lba_src', $file );
	return (int) $id;
}

function lba_category_ids() {
	$ids = array();
	foreach ( lba_catalog()['categories'] as $key => $c ) {
		$term = term_exists( $key, 'product_cat' );
		if ( ! $term ) {
			$term = wp_insert_term( $c['name'], 'product_cat', array( 'slug' => $key, 'description' => $c['blurb'] ) );
		}
		if ( ! is_wp_error( $term ) ) {
			$ids[ $key ] = (int) $term['term_id'];
		}
	}
	return $ids;
}

function lba_find_product( $slug ) {
	$ids = get_posts( array(
		'post_type'   => 'product',
		'post_status' => 'any',
		'meta_key'    => '_lba_slug', // phpcs:ignore
		'meta_value'  => $slug, // phpcs:ignore
		'numberposts' => 1,
		'fields'      => 'ids',
	) );
	return $ids ? (int) $ids[0] : 0;
}

function lba_setup_products() {
	$cats  = lba_category_ids();
	$count = 0;
	foreach ( lba_catalog()['products'] as $i => $p ) {
		lba_upsert_product( $p, $i, $cats );
		$count++;
	}
	if ( function_exists( 'wc_delete_product_transients' ) ) {
		wc_delete_product_transients();
	}
	return $count;
}

function lba_upsert_product( $p, $order, $cats ) {
	$id       = lba_find_product( $p['slug'] );
	$variants = $p['variants'];
	$multi    = count( $variants ) > 1;

	if ( $id ) {
		$product = wc_get_product( $id );
		// Switch type if the number of sizes changed.
		if ( $multi && ! $product->is_type( 'variable' ) ) {
			$product = new WC_Product_Variable( $id );
		} elseif ( ! $multi && ! $product->is_type( 'simple' ) ) {
			$product = new WC_Product_Simple( $id );
		}
	} else {
		$product = $multi ? new WC_Product_Variable() : new WC_Product_Simple();
		$product->set_status( 'publish' );
		$product->set_slug( $p['slug'] );
	}

	$main_variant = $variants[0];
	foreach ( $variants as $v ) {
		if ( ! empty( $v['inStock'] ) ) {
			$main_variant = $v;
			break;
		}
	}
	$img = lba_import_image( $main_variant['sku'] . '.jpg' );

	$product->set_name( $p['name'] );
	$product->set_menu_order( $order );
	$product->set_short_description( $p['cls'] );
	$product->set_description( '<p>' . esc_html( $p['overview'] ) . '</p>' );
	$product->set_featured( ! empty( $p['bestSeller'] ) || $order < 8 );
	$product->set_reviews_allowed( false );
	$product->set_sold_individually( false );
	$product->set_catalog_visibility( 'visible' );
	if ( isset( $cats[ $p['cat'] ] ) ) {
		$product->set_category_ids( array( $cats[ $p['cat'] ] ) );
	}
	if ( $img ) {
		$product->set_image_id( $img );
	}

	if ( $multi ) {
		$attr = new WC_Product_Attribute();
		$attr->set_id( 0 );
		$attr->set_name( 'Size' );
		$attr->set_options( wp_list_pluck( $variants, 'size' ) );
		$attr->set_position( 0 );
		$attr->set_visible( true );
		$attr->set_variation( true );
		$product->set_attributes( array( $attr ) );
		$product->set_default_attributes( array( 'size' => $main_variant['size'] ) );
	} else {
		$v = $variants[0];
		$product->set_attributes( array() );
		$product->set_sku( lba_free_sku( $v['sku'], $product->get_id() ) );
		$product->set_regular_price( number_format( $v['priceCents'] / 100, 2, '.', '' ) );
		$product->set_stock_status( empty( $v['inStock'] ) ? 'outofstock' : 'instock' );
	}
	$pid = $product->save();

	if ( $multi ) {
		$existing = array();
		foreach ( $product->get_children() as $child_id ) {
			$child = wc_get_product( $child_id );
			if ( $child ) {
				$existing[ $child->get_attribute( 'size' ) ] = $child;
			}
		}
		foreach ( $variants as $v ) {
			$var = isset( $existing[ $v['size'] ] ) ? $existing[ $v['size'] ] : new WC_Product_Variation();
			$var->set_parent_id( $pid );
			$var->set_attributes( array( 'size' => $v['size'] ) );
			$var->set_sku( lba_free_sku( $v['sku'], $var->get_id() ) );
			$var->set_regular_price( number_format( $v['priceCents'] / 100, 2, '.', '' ) );
			$var->set_stock_status( empty( $v['inStock'] ) ? 'outofstock' : 'instock' );
			$vimg = lba_import_image( $v['sku'] . '.jpg' );
			if ( $vimg ) {
				$var->set_image_id( $vimg );
			}
			$var->set_status( 'publish' );
			$var->save();
		}
		WC_Product_Variable::sync( $pid );
	}

	$findings = array();
	foreach ( isset( $p['researchFindings'] ) ? $p['researchFindings'] : array() as $f ) {
		$src        = isset( $f['sources'][0] ) ? $f['sources'][0] : array( '', '' );
		$findings[] = implode( ' | ', array( $f['topic'], $f['finding'], $src[0], $src[1] ) );
	}
	$spec = array();
	foreach ( $p['spec'] as $row ) {
		$spec[] = $row[0] . ' | ' . $row[1];
	}
	$meta = array(
		'_lba_slug'     => $p['slug'],
		'_lba_short'    => $p['short'],
		'_lba_color'    => $p['color'],
		'_lba_class'    => $p['cls'],
		'_lba_overview' => $p['overview'],
		'_lba_research' => implode( "\n", $p['research'] ),
		'_lba_findings' => implode( "\n", $findings ),
		'_lba_spec'     => implode( "\n", $spec ),
		'_lba_refs'     => implode( "\n", isset( $p['refs'] ) ? $p['refs'] : array() ),
	);
	foreach ( $meta as $k => $val ) {
		update_post_meta( $pid, $k, $val );
	}
	return $pid;
}

/** WooCommerce refuses duplicate SKUs; fall back to none rather than failing the whole import. */
function lba_free_sku( $sku, $own_id ) {
	$owner = wc_get_product_id_by_sku( $sku );
	return ( ! $owner || (int) $owner === (int) $own_id ) ? $sku : '';
}

/* ---------- Shipping ---------- */

function lba_setup_shipping() {
	if ( get_option( 'lba_ship_ids' ) || ! class_exists( 'WC_Shipping_Zone' ) ) {
		return; // Already created; edit zones under WooCommerce > Settings > Shipping.
	}
	$ids = array( 'delivery' => array(), 'ship' => array() );

	$local = new WC_Shipping_Zone();
	$local->set_zone_name( 'Long Beach area' );
	$local->set_zone_order( 0 );
	$local->add_location( 'US:CA', 'state' );
	$local->add_location( '908*', 'postcode' );
	$local->save();
	lba_add_method( $local, 'local_pickup', array( 'title' => 'Local pickup in Long Beach (free, by appointment)', 'cost' => '0' ) );
	$ids['delivery'][] = lba_add_method( $local, 'flat_rate', array( 'title' => 'Local delivery (Long Beach area)', 'cost' => (string) lba_opt( 'delivery_fee' ) ) );
	$ids['ship'][]     = lba_add_method( $local, 'flat_rate', array( 'title' => 'Shipping, 2-day (US)', 'cost' => (string) lba_opt( 'ship_fee' ) ) );

	$us = new WC_Shipping_Zone();
	$us->set_zone_name( 'United States' );
	$us->set_zone_order( 1 );
	$us->add_location( 'US', 'country' );
	$us->save();
	lba_add_method( $us, 'local_pickup', array( 'title' => 'Local pickup in Long Beach (free, by appointment)', 'cost' => '0' ) );
	$ids['ship'][] = lba_add_method( $us, 'flat_rate', array( 'title' => 'Shipping, 2-day (US)', 'cost' => (string) lba_opt( 'ship_fee' ) ) );

	update_option( 'lba_ship_ids', $ids );
}

function lba_add_method( $zone, $type, $settings ) {
	$instance = $zone->add_shipping_method( $type );
	if ( $instance ) {
		$settings['tax_status'] = 'none';
		update_option( 'woocommerce_' . $type . '_' . $instance . '_settings', $settings );
	}
	return (int) $instance;
}

/* ---------- Payments ---------- */

function lba_setup_gateways() {
	$wallet            = get_option( 'woocommerce_lba_wallet_settings', array() );
	$wallet['enabled'] = 'yes';
	update_option( 'woocommerce_lba_wallet_settings', $wallet );
	$card            = get_option( 'woocommerce_lba_card_settings', array() );
	$card['enabled'] = 'yes';
	update_option( 'woocommerce_lba_card_settings', $card );
	// Our two methods first.
	$order = (array) get_option( 'woocommerce_gateway_order', array() );
	$order = array_merge( $order, array( 'lba_wallet' => 0, 'lba_card' => 1 ) );
	update_option( 'woocommerce_gateway_order', $order );
}

/* ---------- Menu ---------- */

function lba_setup_menu() {
	$name = 'LB Aminos main menu';
	$menu = wp_get_nav_menu_object( $name );
	if ( $menu ) {
		$menu_id = $menu->term_id;
	} else {
		$menu_id = wp_create_nav_menu( $name );
		if ( is_wp_error( $menu_id ) ) {
			return;
		}
		$items = array();
		if ( function_exists( 'wc_get_page_id' ) && wc_get_page_id( 'shop' ) > 0 ) {
			$items[] = array( 'Shop', wc_get_page_id( 'shop' ) );
		}
		foreach ( array( 'coa' => 'Lab reports', 'local-pickup' => 'Local pickup', 'peptide-basics' => 'Learn', 'about' => 'About', 'contact' => 'Contact' ) as $slug => $label ) {
			$pg = get_page_by_path( $slug );
			if ( $pg ) {
				$items[] = array( $label, $pg->ID );
			}
		}
		foreach ( $items as $pos => $it ) {
			wp_update_nav_menu_item( $menu_id, 0, array(
				'menu-item-title'     => $it[0],
				'menu-item-object'    => 'page',
				'menu-item-object-id' => $it[1],
				'menu-item-type'      => 'post_type',
				'menu-item-status'    => 'publish',
				'menu-item-position'  => $pos + 1,
			) );
		}
	}
	$locations            = get_theme_mod( 'nav_menu_locations', array() );
	$locations['primary'] = $menu_id;
	set_theme_mod( 'nav_menu_locations', $locations );
}
