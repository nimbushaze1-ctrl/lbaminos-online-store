<?php
/**
 * LB Aminos theme.
 */
defined( 'ABSPATH' ) || exit;

define( 'LBT_VER', '1.0.0' );

add_action( 'after_setup_theme', function () {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support( 'woocommerce', array( 'thumbnail_image_width' => 600, 'single_image_width' => 900 ) );
	add_theme_support( 'wc-product-gallery-lightbox' );
	register_nav_menus( array( 'primary' => 'Main menu' ) );
} );

add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style( 'lbt-fonts', 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,500;0,600;0,700;1,800&family=Manrope:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap', array(), null );
	wp_enqueue_style( 'lbt-main', get_template_directory_uri() . '/assets/css/main.css', array(), LBT_VER );
	wp_enqueue_script( 'lbt-site', get_template_directory_uri() . '/assets/js/site.js', array(), LBT_VER, true );
} );

// Keep WooCommerce's layout styles but drop its look, so ours wins.
add_filter( 'woocommerce_enqueue_styles', function ( $styles ) {
	unset( $styles['woocommerce-general'] );
	return $styles;
} );

/** Store settings, from the LB Aminos plugin when it's active. */
function lbt_opt( $key ) {
	if ( function_exists( 'lba_opt' ) ) {
		return lba_opt( $key );
	}
	$fallback = array(
		'phone'      => '(310) 810-2013',
		'email'      => 'antwest2727@gmail.com',
		'city'       => 'Long Beach, CA',
		'promo_text' => '',
		'age_gate'   => 1,
	);
	return isset( $fallback[ $key ] ) ? $fallback[ $key ] : '';
}

function lbt_tel( $phone ) {
	return preg_replace( '/[^0-9+]/', '', $phone );
}

function lbt_logo( $class = 'logo' ) {
	return '<img class="' . esc_attr( $class ) . '" src="' . esc_url( get_template_directory_uri() . '/assets/img/lb-aminos.svg' ) . '" alt="LB Aminos" width="120" height="58">';
}

/** Link to a page by slug, falling back to /slug/. */
function lbt_url( $slug ) {
	if ( 'shop' === $slug && function_exists( 'wc_get_page_permalink' ) ) {
		return wc_get_page_permalink( 'shop' );
	}
	$p = get_page_by_path( $slug );
	return $p ? get_permalink( $p ) : home_url( '/' . $slug . '/' );
}

function lbt_woo() {
	return class_exists( 'WooCommerce' );
}

/** Products for cards: WooCommerce products when available, otherwise the bundled catalog (preview mode). */
function lbt_card_items( $limit = 8 ) {
	$items = array();
	if ( lbt_woo() ) {
		$products = wc_get_products( array( 'status' => 'publish', 'limit' => $limit, 'orderby' => 'menu_order', 'order' => 'ASC', 'featured' => true ) );
		if ( ! $products ) {
			$products = wc_get_products( array( 'status' => 'publish', 'limit' => $limit, 'orderby' => 'menu_order', 'order' => 'ASC' ) );
		}
		foreach ( $products as $p ) {
			$items[] = lbt_card_from_product( $p );
		}
	} elseif ( function_exists( 'lba_catalog' ) ) {
		foreach ( array_slice( lba_catalog()['products'], 0, $limit ) as $p ) {
			$v     = $p['variants'][0];
			$sizes = wp_list_pluck( $p['variants'], 'size' );
			$items[] = array(
				'name'    => $p['name'],
				'sizes'   => count( $sizes ) > 1 ? str_replace( ' mg', '', implode( ' / ', $sizes ) ) . ' mg' : $sizes[0],
				'price'   => ( count( $sizes ) > 1 ? '<span class="from">From</span> ' : '' ) . '$' . number_format( $v['priceCents'] / 100, 2 ),
				'img'     => LBA_URL . 'data/images/' . $v['sku'] . '.jpg',
				'url'     => '#',
				'color'   => $p['color'],
				'instock' => ! empty( $v['inStock'] ),
				'cart'    => '',
			);
		}
	}
	return $items;
}

function lbt_card_from_product( $p ) {
	$id    = $p->get_id();
	$sizes = array();
	if ( $p->is_type( 'variable' ) ) {
		$attrs = $p->get_variation_attributes();
		$sizes = isset( $attrs['Size'] ) ? $attrs['Size'] : ( $attrs ? reset( $attrs ) : array() );
	} else {
		$sku   = $p->get_sku();
		$sizes = array( function_exists( 'lba_catalog' ) ? lbt_size_for_sku( $sku ) : '' );
	}
	$sizes = array_values( array_filter( (array) $sizes ) );
	$img   = $p->get_image_id() ? wp_get_attachment_image_url( $p->get_image_id(), 'woocommerce_thumbnail' ) : wc_placeholder_img_src();
	$cart  = '';
	if ( $p->is_type( 'simple' ) && $p->is_purchasable() && $p->is_in_stock() ) {
		$cart = sprintf( '<a href="%s" data-quantity="1" data-product_id="%d" class="btn btn-primary btn-sm add_to_cart_button ajax_add_to_cart" rel="nofollow">Add to cart</a>', esc_url( $p->add_to_cart_url() ), $id );
	} else {
		$cart = '<a href="' . esc_url( get_permalink( $id ) ) . '" class="btn btn-primary btn-sm">Choose size</a>';
	}
	return array(
		'name'    => $p->get_name(),
		'sizes'   => count( $sizes ) > 1 ? str_replace( ' mg', '', implode( ' / ', $sizes ) ) . ' mg' : ( $sizes ? $sizes[0] : '' ),
		'price'   => $p->get_price_html(),
		'img'     => $img,
		'url'     => get_permalink( $id ),
		'color'   => get_post_meta( $id, '_lba_color', true ) ? get_post_meta( $id, '_lba_color', true ) : '#2E3440',
		'instock' => $p->is_in_stock(),
		'cart'    => $cart,
		'coa'     => get_post_meta( $id, '_lba_coa', true ),
	);
}

function lbt_size_for_sku( $sku ) {
	foreach ( lba_catalog()['products'] as $p ) {
		foreach ( $p['variants'] as $v ) {
			if ( $v['sku'] === $sku ) {
				return $v['size'];
			}
		}
	}
	return '';
}

function lbt_card( $it ) {
	?>
	<article class="card" style="--c:<?php echo esc_attr( $it['color'] ); ?>">
		<a class="card-img" href="<?php echo esc_url( $it['url'] ); ?>"><img src="<?php echo esc_url( $it['img'] ); ?>" alt="<?php echo esc_attr( $it['name'] . ' research vial' ); ?>" loading="lazy" width="600" height="600"></a>
		<div class="card-body">
			<h3><a href="<?php echo esc_url( $it['url'] ); ?>"><?php echo esc_html( $it['name'] ); ?></a></h3>
			<p class="card-size"><?php echo esc_html( $it['sizes'] ); ?></p>
			<p class="card-meta mono"><?php echo $it['coa'] ?? '' ? 'COA on file' : 'COA pending'; ?> · <span class="<?php echo $it['instock'] ? 'ok' : 'warn'; ?>"><?php echo $it['instock'] ? 'In stock' : 'Out of stock'; ?></span></p>
			<p class="card-price"><?php echo wp_kses_post( $it['price'] ); ?></p>
			<div class="card-btns">
				<a class="btn btn-ghost btn-sm" href="<?php echo esc_url( $it['url'] ); ?>">Details</a>
				<?php echo $it['cart'] ? wp_kses_post( $it['cart'] ) : '<a class="btn btn-primary btn-sm" href="' . esc_url( lbt_url( 'contact' ) ) . '">Order</a>'; ?>
			</div>
		</div>
	</article>
	<?php
}

require get_template_directory() . '/inc/woocommerce.php';
