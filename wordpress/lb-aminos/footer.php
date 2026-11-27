<?php
$phone = lbt_opt( 'phone' );
$email = lbt_opt( 'email' );
?>
<footer class="site">
	<div class="wrap foot-grid">
		<div>
			<?php echo lbt_logo( 'logo logo-inv' ); // phpcs:ignore ?>
			<p>Research-grade peptides from <?php echo esc_html( lbt_opt( 'city' ) ); ?>. Every lot independently tested.</p>
			<p><a href="tel:<?php echo esc_attr( lbt_tel( $phone ) ); ?>"><?php echo esc_html( $phone ); ?></a><br><a href="mailto:<?php echo esc_attr( $email ); ?>"><?php echo esc_html( $email ); ?></a></p>
		</div>
		<div>
			<h4>Shop</h4>
			<a href="<?php echo esc_url( lbt_url( 'shop' ) ); ?>">All compounds</a>
			<a href="<?php echo esc_url( lbt_url( 'coa' ) ); ?>">Lab reports</a>
			<a href="<?php echo esc_url( lbt_url( 'local-pickup' ) ); ?>">Local pickup &amp; delivery</a>
			<a href="<?php echo esc_url( lbt_url( 'shipping' ) ); ?>">Shipping</a>
		</div>
		<div>
			<h4>Learn</h4>
			<a href="<?php echo esc_url( lbt_url( 'peptide-basics' ) ); ?>">Peptide fundamentals</a>
			<a href="<?php echo esc_url( lbt_url( 'handling-storage' ) ); ?>">Handling &amp; storage</a>
			<a href="<?php echo esc_url( lbt_url( 'reading-a-coa' ) ); ?>">Reading a COA</a>
			<a href="<?php echo esc_url( lbt_url( 'about' ) ); ?>">About us</a>
		</div>
		<div>
			<h4>Legal</h4>
			<a href="<?php echo esc_url( lbt_url( 'terms' ) ); ?>">Terms of sale</a>
			<a href="<?php echo esc_url( lbt_url( 'privacy' ) ); ?>">Privacy</a>
			<a href="<?php echo esc_url( lbt_url( 'research-use' ) ); ?>">Research-use policy</a>
			<a href="<?php echo esc_url( lbt_url( 'refunds' ) ); ?>">Returns &amp; refunds</a>
			<a href="<?php echo esc_url( lbt_url( 'disclaimer' ) ); ?>">Disclaimer</a>
		</div>
	</div>
	<div class="wrap disclaimer">
		All products sold by LB Aminos are intended for in-vitro laboratory research and analytical use only. They are not drugs, foods, dietary supplements or cosmetics, have not been evaluated by the FDA, and are not intended to diagnose, treat, cure or prevent any disease. Not for human or veterinary use. Buyers must be 21 or older.
	</div>
	<div class="foot-base"><div class="wrap mono">© <?php echo esc_html( gmdate( 'Y' ) ); ?> LB Aminos · <?php echo esc_html( lbt_opt( 'city' ) ); ?> · Pay by card, Zelle, Venmo or Cash App</div></div>
</footer>

<?php if ( lbt_opt( 'age_gate' ) ) : ?>
<div class="gate" id="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title" hidden>
	<div class="gate-card">
		<?php echo lbt_logo( 'logo big' ); // phpcs:ignore ?>
		<h2 id="gate-title">Before you enter</h2>
		<p>LB Aminos sells peptides strictly for laboratory and in-vitro research. To continue, confirm that:</p>
		<ul>
			<li>You are 21 years of age or older.</li>
			<li>You are purchasing for legitimate research purposes only.</li>
			<li>You will not use, or allow others to use, these products in humans or animals.</li>
		</ul>
		<div class="row-btns">
			<button class="btn btn-primary" id="gate-yes">I confirm, enter</button>
			<a class="btn btn-ghost" href="https://www.google.com">Leave</a>
		</div>
	</div>
</div>
<?php endif; ?>
<?php wp_footer(); ?>
</body>
</html>
