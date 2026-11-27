<?php
/**
 * Delivery and shipping prices come from LB Aminos settings, including the free-over amounts.
 */
defined( 'ABSPATH' ) || exit;

add_filter( 'woocommerce_package_rates', function ( $rates, $package ) {
	$ids = get_option( 'lba_ship_ids' );
	if ( ! is_array( $ids ) ) {
		return $rates;
	}
	$subtotal = WC()->cart ? (float) WC()->cart->get_displayed_subtotal() : 0;
	$rules    = array(
		'delivery' => array( (float) lba_opt( 'delivery_fee' ), (float) lba_opt( 'delivery_free' ) ),
		'ship'     => array( (float) lba_opt( 'ship_fee' ), (float) lba_opt( 'ship_free' ) ),
	);
	foreach ( $rates as $rate ) {
		foreach ( $rules as $kind => $rule ) {
			if ( in_array( (int) $rate->get_instance_id(), array_map( 'intval', $ids[ $kind ] ), true ) ) {
				$free = $rule[1] > 0 && $subtotal >= $rule[1];
				$rate->set_cost( $free ? 0 : $rule[0] );
				$rate->set_taxes( array() );
				if ( $free ) {
					$rate->set_label( $rate->get_label() . ' (free)' );
				}
			}
		}
	}
	return $rates;
}, 20, 2 );
