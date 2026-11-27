<?php
/**
 * "Research details" box on the product edit screen, plus the contact / pickup / lab-report shortcodes.
 */
defined( 'ABSPATH' ) || exit;

function lba_meta_fields() {
	return array(
		'_lba_short'    => array( 'Label on vial', 'Short name, e.g. RETA', 'text' ),
		'_lba_color'    => array( 'Accent color', 'Brand color for this compound, e.g. #3B82F6', 'text' ),
		'_lba_class'    => array( 'Compound class', 'One line, e.g. "Triple receptor agonist peptide"', 'text' ),
		'_lba_overview' => array( 'Overview', 'A short neutral paragraph. No dosing, use or benefit claims.', 'textarea' ),
		'_lba_research' => array( 'Research areas', 'One per line.', 'textarea' ),
		'_lba_findings' => array( 'Published findings', 'One per line: Topic | Finding | Source name | Source link', 'textarea' ),
		'_lba_spec'     => array( 'Specifications', 'One per line: Label | Value (e.g. CAS no. | 2381089-83-2)', 'textarea' ),
		'_lba_refs'     => array( 'References', 'One citation per line.', 'textarea' ),
		'_lba_coa'      => array( 'Lab report (COA) link', 'Link to the PDF for the current lot. Upload it under Media first.', 'text' ),
	);
}

add_action( 'add_meta_boxes', function () {
	add_meta_box( 'lba-details', 'Research details (LB Aminos)', 'lba_render_meta_box', 'product', 'normal', 'high' );
} );

function lba_render_meta_box( $post ) {
	wp_nonce_field( 'lba_meta', 'lba_meta_nonce' );
	echo '<p>These show on the product page. Keep wording neutral: research context only, no dosing or human-use claims.</p><table class="form-table">';
	foreach ( lba_meta_fields() as $key => $f ) {
		$val = get_post_meta( $post->ID, $key, true );
		echo '<tr><th><label for="' . esc_attr( $key ) . '">' . esc_html( $f[0] ) . '</label></th><td>';
		if ( 'textarea' === $f[2] ) {
			echo '<textarea id="' . esc_attr( $key ) . '" name="' . esc_attr( $key ) . '" rows="4" class="large-text">' . esc_textarea( $val ) . '</textarea>';
		} else {
			echo '<input id="' . esc_attr( $key ) . '" name="' . esc_attr( $key ) . '" value="' . esc_attr( $val ) . '" class="regular-text">';
		}
		echo '<p class="description">' . esc_html( $f[1] ) . '</p></td></tr>';
	}
	echo '</table>';
}

add_action( 'save_post_product', function ( $post_id ) {
	if ( ! isset( $_POST['lba_meta_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['lba_meta_nonce'] ) ), 'lba_meta' ) ) {
		return;
	}
	if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	foreach ( lba_meta_fields() as $key => $f ) {
		if ( ! isset( $_POST[ $key ] ) ) {
			continue;
		}
		$raw = wp_unslash( $_POST[ $key ] ); // phpcs:ignore
		if ( '_lba_coa' === $key ) {
			$val = esc_url_raw( $raw );
		} elseif ( '_lba_color' === $key ) {
			$val = sanitize_hex_color( $raw ) ? sanitize_hex_color( $raw ) : '';
		} elseif ( 'textarea' === $f[2] ) {
			$val = sanitize_textarea_field( $raw );
		} else {
			$val = sanitize_text_field( $raw );
		}
		update_post_meta( $post_id, $key, $val );
	}
} );

/* ---------- Shortcodes ---------- */

add_shortcode( 'lba_contact', function () {
	$phone = lba_opt( 'phone' );
	$email = lba_opt( 'email' );
	$tel   = preg_replace( '/[^0-9+]/', '', $phone );
	ob_start();
	?>
	<div class="lba-cards">
		<div class="lba-card">
			<h3>Text or call</h3>
			<p><a href="tel:<?php echo esc_attr( $tel ); ?>"><?php echo esc_html( $phone ); ?></a></p>
			<p class="lba-muted">Fastest for pickup times and order questions.</p>
		</div>
		<div class="lba-card">
			<h3>Email</h3>
			<p><a href="mailto:<?php echo esc_attr( $email ); ?>"><?php echo esc_html( $email ); ?></a></p>
			<p class="lba-muted">We reply within <?php echo esc_html( lba_opt( 'reply_hours' ) ); ?> hours.</p>
		</div>
	</div>
	<p class="lba-note">We can't answer questions about dosing, preparation or personal use. Messages that reference human or animal use won't receive a reply.</p>
	<?php
	return ob_get_clean();
} );

/** Pickup hours as rows, used by the shortcode and the theme. */
function lba_pickup_rows() {
	return lba_rows( lba_opt( 'pickup_hours' ) );
}

add_shortcode( 'lba_pickup', function () {
	$phone = lba_opt( 'phone' );
	ob_start();
	?>
	<p>Order online, choose <strong>Local pickup</strong> at checkout, and we'll confirm a time by text or email. Most orders are ready the same day. Bring your order number; we confirm lot numbers at handoff.</p>
	<div class="lba-card">
		<h3><?php echo esc_html( lba_opt( 'city' ) ); ?> pickup</h3>
		<p class="lba-muted">Exact address sent with your confirmed appointment.</p>
		<table class="lba-hours">
			<?php foreach ( lba_pickup_rows() as $r ) : ?>
				<tr><th><?php echo esc_html( $r[0] ); ?></th><td><?php echo esc_html( isset( $r[1] ) ? $r[1] : '' ); ?></td></tr>
			<?php endforeach; ?>
		</table>
		<p><a href="tel:<?php echo esc_attr( preg_replace( '/[^0-9+]/', '', $phone ) ); ?>"><?php echo esc_html( $phone ); ?></a></p>
	</div>
	<h3>Local delivery</h3>
	<p>Long Beach area delivery is $<?php echo esc_html( lba_opt( 'delivery_fee' ) ); ?>, free on orders over $<?php echo esc_html( lba_opt( 'delivery_free' ) ); ?>. Choose it at checkout and we'll text you a delivery window.</p>
	<?php
	return ob_get_clean();
} );

add_shortcode( 'lba_coa', function () {
	$rows = array();
	if ( post_type_exists( 'product' ) ) {
		$ids = get_posts( array( 'post_type' => 'product', 'numberposts' => -1, 'orderby' => 'menu_order', 'order' => 'ASC', 'fields' => 'ids' ) );
		foreach ( $ids as $id ) {
			$rows[] = array( get_the_title( $id ), get_permalink( $id ), get_post_meta( $id, '_lba_coa', true ) );
		}
	}
	ob_start();
	?>
	<p>Every lot is sent to an independent analytical lab for HPLC purity and mass-spec identity testing. Each report lists the lot number, measured content and a code you can verify with the lab directly. Match the lot number on your vial to the report below.</p>
	<table class="lba-coa">
		<thead><tr><th>Compound</th><th>Current lot report</th></tr></thead>
		<tbody>
		<?php foreach ( $rows as $r ) : ?>
			<tr>
				<td><a href="<?php echo esc_url( $r[1] ); ?>"><?php echo esc_html( $r[0] ); ?></a></td>
				<td><?php echo $r[2] ? '<a href="' . esc_url( $r[2] ) . '" target="_blank" rel="noopener">View report (PDF)</a>' : '<span class="lba-muted">Testing in progress. Ask us for the latest report.</span>'; ?></td>
			</tr>
		<?php endforeach; ?>
		</tbody>
	</table>
	<?php
	return ob_get_clean();
} );
