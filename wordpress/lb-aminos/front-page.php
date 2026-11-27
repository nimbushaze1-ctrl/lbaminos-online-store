<?php
get_header();
$img   = get_template_directory_uri() . '/assets/img/';
$phone = lbt_opt( 'phone' );
$hours = function_exists( 'lba_pickup_rows' ) ? lba_pickup_rows() : array( array( 'Mon–Fri', '10 am – 7 pm' ), array( 'Sat', '11 am – 5 pm' ), array( 'Sun', 'By request' ) );
$faq   = array(
	array( 'What does “research use only” mean?', 'Every product we sell is intended solely for in-vitro laboratory research and analytical use. Nothing here is a drug, supplement, food or cosmetic, and nothing is intended to diagnose, treat, cure or prevent any condition. Products are not for human or animal use of any kind.' ),
	array( 'Do you give dosing or preparation instructions?', 'No. We don’t provide dosing, administration or preparation guidance for any purpose, and we decline orders that mention human or animal use. Researchers should follow their own protocols and the published literature.' ),
	array( 'How do I pay?', 'Place your order and choose card, Zelle, Venmo or Cash App. Your order page and email show exactly what to send and the code to put in the memo. For card, we text or email you a secure Stripe payment link. We never see or store your card details.' ),
	array( 'How does local pickup work?', 'Choose “Local pickup” at checkout. Once your payment arrives we text or email you to set a time, usually same day. Bring your order number; we confirm lot numbers at handoff.' ),
	array( 'How do I know the vial matches the report?', 'Each vial carries a lot number. Find that lot in our lab reports and check the purity, identity and measured content. Each report includes a code you can check with the testing lab directly.' ),
	array( 'Who can buy?', 'Adults 21 and over purchasing for legitimate research. We may cancel and refund any order at our discretion.' ),
);
?>
<main id="main">
	<section class="hero">
		<div class="wrap hero-grid">
			<div class="hero-copy">
				<span class="eyebrow"><?php echo esc_html( lbt_opt( 'city' ) ); ?> · Research supply</span>
				<h1>Research compounds, tested lot by lot.</h1>
				<p class="lead">Sealed, lyophilized research peptides with a lot number on every vial and an independent lab report behind every lot. Pick up today in Long Beach, or have it delivered.</p>
				<div class="row-btns">
					<a class="btn btn-primary" href="<?php echo esc_url( lbt_woo() ? lbt_url( 'shop' ) : '#compounds' ); ?>">Shop compounds →</a>
					<a class="btn btn-ghost" href="<?php echo esc_url( lbt_url( 'coa' ) ); ?>">See lab reports</a>
				</div>
			</div>
			<div class="hero-img"><img src="<?php echo esc_url( $img . 'hero.jpg' ); ?>" alt="LB Aminos research vials lined up" width="1200" height="900"></div>
		</div>
		<div class="wrap trust">
			<div><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/></svg><span><strong>Independent testing</strong>HPLC purity + mass-spec identity</span></div>
			<div><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg><span><strong>Local pickup</strong>Long Beach, usually same day</span></div>
			<div><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg><span><strong>Easy payment</strong>Card, Zelle, Venmo, Cash App</span></div>
		</div>
	</section>

	<section class="block" id="compounds">
		<div class="wrap">
			<div class="sec-head">
				<div><span class="eyebrow">Catalog</span><h2>Featured compounds</h2></div>
				<?php if ( lbt_woo() ) : ?><a class="btn btn-ghost btn-sm" href="<?php echo esc_url( lbt_url( 'shop' ) ); ?>">Shop all compounds ↗</a><?php endif; ?>
			</div>
			<div class="grid">
				<?php foreach ( lbt_card_items( 8 ) as $it ) { lbt_card( $it ); } ?>
			</div>
		</div>
	</section>

	<section class="block sunk">
		<div class="wrap split">
			<div>
				<span class="eyebrow">Savings</span>
				<h2>Buy one, get one 50% off. Research boxes save up to 15%.</h2>
				<p>Add two of any compound and the second is half price. Buying more of the same compound? The per-vial price drops automatically. You always get whichever saves you more, with no codes needed.</p>
			</div>
			<table class="tbl">
				<thead><tr><th>Quantity</th><th>Per-vial discount</th></tr></thead>
				<tbody>
					<tr><td>1–2 vials</td><td class="mono">List price</td></tr>
					<tr><td>3–4 vials</td><td class="mono">−5%</td></tr>
					<tr><td>5–9 vials</td><td class="mono">−10%</td></tr>
					<tr><td>10+ (research box)</td><td class="mono">−15%</td></tr>
				</tbody>
			</table>
		</div>
	</section>

	<section class="block">
		<div class="wrap split">
			<div>
				<span class="eyebrow">Local pickup</span>
				<h2>Pick up today in Long Beach</h2>
				<p>Order online, choose local pickup or delivery, and we’ll confirm a time by text or email. Most orders are ready the same day.</p>
				<h3>Is this legit?</h3>
				<p>Every lot we sell is sent to an independent analytical lab. Match the lot number on your vial to its report before you leave.</p>
				<h3>How do I pay?</h3>
				<p>Card (secure Stripe link), Zelle, Venmo or Cash App. Your order page tells you exactly what to send.</p>
			</div>
			<div class="panel pickup">
				<h3><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg> <?php echo esc_html( lbt_opt( 'city' ) ); ?></h3>
				<p class="small muted">Exact address sent with your confirmed appointment.</p>
				<table class="hours">
					<?php foreach ( $hours as $h ) : ?>
						<tr><th><?php echo esc_html( $h[0] ); ?></th><td><?php echo esc_html( isset( $h[1] ) ? $h[1] : '' ); ?></td></tr>
					<?php endforeach; ?>
				</table>
				<div class="row-btns">
					<a class="btn btn-primary btn-sm" href="<?php echo esc_url( lbt_url( 'local-pickup' ) ); ?>">Pickup details</a>
					<a class="btn btn-ghost btn-sm" href="tel:<?php echo esc_attr( lbt_tel( $phone ) ); ?>"><?php echo esc_html( $phone ); ?></a>
				</div>
			</div>
		</div>
	</section>

	<section class="block sunk">
		<div class="wrap split">
			<div>
				<span class="eyebrow">FAQ</span>
				<h2>Straight answers</h2>
				<p>Anything else? <a href="<?php echo esc_url( lbt_url( 'contact' ) ); ?>">Get in touch</a>.</p>
			</div>
			<div class="faq">
				<?php foreach ( $faq as $i => $q ) : ?>
					<details<?php echo 0 === $i ? ' open' : ''; ?>><summary><?php echo esc_html( $q[0] ); ?></summary><p><?php echo esc_html( $q[1] ); ?></p></details>
				<?php endforeach; ?>
			</div>
		</div>
	</section>

	<section class="cta-band">
		<div class="wrap split">
			<div>
				<span class="eyebrow">Questions before you order?</span>
				<h2>Text us. A real person answers.</h2>
			</div>
			<div class="row-btns end">
				<a class="btn btn-light" href="tel:<?php echo esc_attr( lbt_tel( $phone ) ); ?>"><?php echo esc_html( $phone ); ?></a>
				<a class="btn btn-outline-light" href="<?php echo esc_url( lbt_url( 'contact' ) ); ?>">Contact</a>
			</div>
		</div>
	</section>
</main>
<?php
get_footer();
