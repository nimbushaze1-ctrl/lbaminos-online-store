<?php
/**
 * Product card in shop grids (overrides WooCommerce's default).
 *
 * @version 9.4.0
 */
defined( 'ABSPATH' ) || exit;

global $product;
if ( empty( $product ) || ! $product->is_visible() ) {
	return;
}
echo '<li class="product-li">';
lbt_card( lbt_card_from_product( $product ) );
echo '</li>';
