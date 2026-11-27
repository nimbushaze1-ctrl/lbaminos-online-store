<?php
/**
 * WooCommerce layout for LB Aminos.
 */
defined( 'ABSPATH' ) || exit;

if ( ! class_exists( 'WooCommerce' ) ) {
	return;
}

// Page wrappers.
remove_action( 'woocommerce_before_main_content', 'woocommerce_output_content_wrapper', 10 );
remove_action( 'woocommerce_after_main_content', 'woocommerce_output_content_wrapper_end', 10 );
remove_action( 'woocommerce_sidebar', 'woocommerce_get_sidebar', 10 );
add_action( 'woocommerce_before_main_content', function () {
	echo '<main id="main" class="block shop-main"><div class="wrap">';
}, 10 );
add_action( 'woocommerce_after_main_content', function () {
	echo '</div></main>';
}, 10 );

add_filter( 'loop_shop_columns', function () {
	return 4;
} );
add_filter( 'loop_shop_per_page', function () {
	return 24;
} );
add_filter( 'woocommerce_output_related_products_args', function ( $args ) {
	$args['posts_per_page'] = 4;
	$args['columns']        = 4;
	return $args;
} );

// Shop page intro.
add_action( 'woocommerce_archive_description', function () {
	if ( is_shop() ) {
		echo '<p class="lead">Every compound ships as a sealed, lyophilized vial with a lot number you can match to its lab report. For laboratory research use only.</p>';
	}
}, 5 );

/* ---------- Single product ---------- */

remove_action( 'woocommerce_after_single_product_summary', 'woocommerce_output_product_data_tabs', 10 );
remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_rating', 10 );

add_action( 'woocommerce_single_product_summary', function () {
	global $product;
	$color = get_post_meta( $product->get_id(), '_lba_color', true );
	$short = get_post_meta( $product->get_id(), '_lba_short', true );
	if ( $short ) {
		echo '<span class="chip" style="--c:' . esc_attr( $color ? $color : '#2E3440' ) . '">' . esc_html( $short ) . '</span>';
	}
}, 4 );

add_action( 'woocommerce_single_product_summary', function () {
	echo '<p class="ruo-inline">For laboratory research use only. Not for human or animal use.</p>';
}, 25 );

add_action( 'woocommerce_single_product_summary', function () {
	if ( ! function_exists( 'lba_tiers' ) ) {
		return;
	}
	$rows = '';
	foreach ( array_reverse( lba_tiers() ) as $t ) {
		$rows .= '<tr><td>' . esc_html( $t['label'] ) . '</td><td class="mono">' . ( $t['pct'] ? '−' . (int) $t['pct'] . '%' : 'List price' ) . '</td></tr>';
	}
	echo '<div class="perks">';
	if ( lba_opt( 'bogo_on' ) ) {
		echo '<p class="perk"><strong>Buy one, get one 50% off.</strong> Applied automatically in the cart.</p>';
	}
	if ( lba_opt( 'bulk_on' ) ) {
		echo '<details class="tiers"><summary>Bulk pricing on this compound</summary><table>' . $rows . '</table></details>'; // phpcs:ignore
	}
	echo '<ul class="ticks"><li>Local pickup in Long Beach, usually same day</li><li>Pay by card, Zelle, Venmo or Cash App</li><li>Sealed lyophilized vial, lot-numbered</li></ul></div>';
}, 35 );

add_action( 'woocommerce_after_single_product_summary', 'lbt_research_details', 5 );

function lbt_research_details() {
	global $product;
	if ( ! function_exists( 'lba_details' ) ) {
		echo '<section class="pd">' . wp_kses_post( wpautop( $product->get_description() ) ) . '</section>';
		return;
	}
	$d = lba_details( $product->get_id() );
	?>
	<section class="pd" style="--c:<?php echo esc_attr( $d['color'] ); ?>">
		<div class="pd-main">
			<?php if ( $d['overview'] ) : ?>
				<h2>Overview</h2>
				<p><?php echo esc_html( $d['overview'] ); ?></p>
			<?php else : ?>
				<?php echo wp_kses_post( wpautop( $product->get_description() ) ); ?>
			<?php endif; ?>

			<?php if ( $d['research'] ) : ?>
				<h3>Research areas</h3>
				<ul class="ticks"><?php foreach ( $d['research'] as $r ) : ?><li><?php echo esc_html( $r ); ?></li><?php endforeach; ?></ul>
			<?php endif; ?>

			<?php if ( $d['findings'] ) : ?>
				<h3>Published research</h3>
				<p class="small muted">Summaries of published studies, for scientific context only. They are not claims about this product and do not suggest any use in people.</p>
				<div class="findings">
				<?php foreach ( $d['findings'] as $f ) : ?>
					<div class="finding">
						<h4><?php echo esc_html( $f[0] ); ?></h4>
						<p><?php echo esc_html( isset( $f[1] ) ? $f[1] : '' ); ?></p>
						<?php if ( ! empty( $f[3] ) ) : ?>
							<a class="small" href="<?php echo esc_url( $f[3] ); ?>" target="_blank" rel="noopener"><?php echo esc_html( $f[2] ? $f[2] : 'Source' ); ?> ↗</a>
						<?php endif; ?>
					</div>
				<?php endforeach; ?>
				</div>
			<?php endif; ?>

			<?php if ( $d['refs'] ) : ?>
				<h3>References</h3>
				<ol class="refs small"><?php foreach ( $d['refs'] as $r ) : ?><li><?php echo esc_html( $r ); ?></li><?php endforeach; ?></ol>
			<?php endif; ?>
		</div>
		<aside class="pd-side">
			<?php if ( $d['spec'] ) : ?>
				<div class="panel">
					<h3>Specifications</h3>
					<dl class="spec">
						<?php foreach ( $d['spec'] as $s ) : ?>
							<dt><?php echo esc_html( $s[0] ); ?></dt><dd><?php echo esc_html( isset( $s[1] ) ? $s[1] : '' ); ?></dd>
						<?php endforeach; ?>
						<dt>Storage</dt><dd>−20 °C, sealed, away from light</dd>
					</dl>
				</div>
			<?php endif; ?>
			<div class="panel">
				<h3>Lab report</h3>
				<?php if ( $d['coa'] ) : ?>
					<p>Independent HPLC purity and mass-spec identity report for the current lot.</p>
					<a class="btn btn-ghost btn-sm" href="<?php echo esc_url( $d['coa'] ); ?>" target="_blank" rel="noopener">View COA (PDF)</a>
				<?php else : ?>
					<p>Testing for the current lot is in progress. Ask us and we'll send the latest report.</p>
					<a class="btn btn-ghost btn-sm" href="<?php echo esc_url( lbt_url( 'coa' ) ); ?>">All lab reports</a>
				<?php endif; ?>
			</div>
			<div class="panel panel-dark">
				<h3>Research use only</h3>
				<p>Sold strictly for in-vitro laboratory research. Not a drug, food, supplement or cosmetic. Not for human or animal use. We don't provide dosing or preparation guidance.</p>
			</div>
		</aside>
	</section>
	<?php
}

// Mini cart count for the header.
add_filter( 'woocommerce_add_to_cart_fragments', function ( $fragments ) {
	$n = WC()->cart ? WC()->cart->get_cart_contents_count() : 0;
	$fragments['span.cart-count'] = '<span class="cart-count' . ( $n ? ' on' : '' ) . '">' . (int) $n . '</span>';
	return $fragments;
} );
