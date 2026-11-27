<?php
defined( 'ABSPATH' ) || exit;

/** Default store settings. Every value can be changed under LB Aminos in the dashboard. */
function lba_defaults() {
	return array(
		'phone'          => '(310) 810-2013',
		'email'          => 'antwest2727@gmail.com',
		'city'           => 'Long Beach, CA',
		'zelle'          => '(310) 819-5313',
		'zelle_name'     => '',
		'venmo'          => '@lbaminos',
		'cashapp'        => '$lbaminos',
		'reply_hours'    => 12,
		'pickup_hours'   => "Mon–Fri | 10 am – 7 pm\nSat | 11 am – 5 pm\nSun | By request",
		'bulk_on'        => 1,
		'bogo_on'        => 1,
		'delivery_fee'   => 10,
		'delivery_free'  => 150,
		'ship_fee'       => 15,
		'ship_free'      => 200,
		'promo_text'     => 'Buy one, get one 50% off any compound. Bulk boxes save up to 15%.',
		'age_gate'       => 1,
	);
}

function lba_opt( $key ) {
	$saved    = get_option( 'lba_settings', array() );
	$defaults = lba_defaults();
	if ( is_array( $saved ) && array_key_exists( $key, $saved ) ) {
		return $saved[ $key ];
	}
	return isset( $defaults[ $key ] ) ? $defaults[ $key ] : '';
}

/** Quantity ladder: per-vial discount by quantity of the same item. */
function lba_tiers() {
	return array(
		array( 'min' => 10, 'pct' => 15, 'label' => '10+ (research box)' ),
		array( 'min' => 5, 'pct' => 10, 'label' => '5–9 vials' ),
		array( 'min' => 3, 'pct' => 5, 'label' => '3–4 vials' ),
		array( 'min' => 1, 'pct' => 0, 'label' => '1–2 vials' ),
	);
}

function lba_tier_pct( $qty ) {
	foreach ( lba_tiers() as $t ) {
		if ( $qty >= $t['min'] ) {
			return $t['pct'];
		}
	}
	return 0;
}

/** The bundled catalog (used for setup, and by the theme when WooCommerce isn't active yet). */
function lba_catalog() {
	static $cat = null;
	if ( null === $cat ) {
		$raw = file_get_contents( LBA_DIR . 'data/catalog.json' ); // phpcs:ignore
		$cat = json_decode( $raw, true );
	}
	return $cat;
}

/** Research details stored on a product (written by setup, editable in the product screen). */
function lba_details( $product_id ) {
	$get = function ( $k ) use ( $product_id ) {
		return get_post_meta( $product_id, $k, true );
	};
	return array(
		'short'    => $get( '_lba_short' ),
		'color'    => $get( '_lba_color' ) ? $get( '_lba_color' ) : '#2E3440',
		'cls'      => $get( '_lba_class' ),
		'overview' => $get( '_lba_overview' ),
		'research' => lba_lines( $get( '_lba_research' ) ),
		'findings' => lba_rows( $get( '_lba_findings' ) ),
		'spec'     => lba_rows( $get( '_lba_spec' ) ),
		'refs'     => lba_lines( $get( '_lba_refs' ) ),
		'coa'      => $get( '_lba_coa' ),
	);
}

function lba_lines( $text ) {
	return array_values( array_filter( array_map( 'trim', preg_split( '/\r\n|\r|\n/', (string) $text ) ) ) );
}

/** "a | b | c" lines into arrays. */
function lba_rows( $text ) {
	$out = array();
	foreach ( lba_lines( $text ) as $line ) {
		$out[] = array_map( 'trim', explode( '|', $line ) );
	}
	return $out;
}

/** Payment handles that are filled in, in display order. */
function lba_wallets() {
	$w = array();
	if ( lba_opt( 'zelle' ) ) {
		$w['zelle'] = array( 'label' => 'Zelle', 'handle' => lba_opt( 'zelle' ), 'blurb' => 'Send from your bank app.' );
	}
	if ( lba_opt( 'venmo' ) ) {
		$w['venmo'] = array( 'label' => 'Venmo', 'handle' => lba_opt( 'venmo' ), 'blurb' => 'Send to our Venmo.' );
	}
	if ( lba_opt( 'cashapp' ) ) {
		$w['cashapp'] = array( 'label' => 'Cash App', 'handle' => lba_opt( 'cashapp' ), 'blurb' => 'Send to our $cashtag.' );
	}
	return $w;
}

/** Memo code customers put on their payment, e.g. LB-001234. */
function lba_memo_code( $order ) {
	return 'LB-' . str_pad( (string) $order->get_order_number(), 6, '0', STR_PAD_LEFT );
}
