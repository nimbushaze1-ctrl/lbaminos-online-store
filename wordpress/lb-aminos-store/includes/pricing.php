<?php
/**
 * Bulk pricing and buy-one-get-one, applied automatically in the cart.
 * For each line the customer gets whichever is cheaper: the bulk tier or BOGO 50%.
 */
defined( 'ABSPATH' ) || exit;

/**
 * Discount in dollars for one cart line.
 *
 * @return array{0: float, 1: string} amount, kind ('bulk'|'bogo'|'').
 */
function lba_line_discount( $unit, $qty ) {
	$list = $unit * $qty;
	$best = $list;
	$kind = '';
	if ( lba_opt( 'bulk_on' ) ) {
		$pct = lba_tier_pct( $qty );
		if ( $pct ) {
			$tier = round( $unit * ( 100 - $pct ) / 100, 2 ) * $qty;
			if ( $tier < $best ) {
				$best = $tier;
				$kind = 'bulk';
			}
		}
	}
	if ( lba_opt( 'bogo_on' ) && $qty >= 2 ) {
		$pairs = (int) floor( $qty / 2 );
		$bogo  = $unit * ( $qty - $pairs ) + round( $unit / 2, 2 ) * $pairs;
		if ( $bogo < $best ) {
			$best = $bogo;
			$kind = 'bogo';
		}
	}
	return array( round( $list - $best, 2 ), $kind );
}

add_action( 'woocommerce_cart_calculate_fees', function ( $cart ) {
	if ( is_admin() && ! defined( 'DOING_AJAX' ) ) {
		return;
	}
	$totals = array( 'bulk' => 0, 'bogo' => 0 );
	foreach ( $cart->get_cart() as $item ) {
		$unit = (float) $item['data']->get_price();
		list( $amount, $kind ) = lba_line_discount( $unit, (int) $item['quantity'] );
		if ( $kind ) {
			$totals[ $kind ] += $amount;
		}
	}
	if ( $totals['bogo'] > 0 ) {
		$cart->add_fee( 'Buy one, get one 50% off', -$totals['bogo'], false );
	}
	if ( $totals['bulk'] > 0 ) {
		$cart->add_fee( 'Bulk discount', -$totals['bulk'], false );
	}
} );
