import Link from 'next/link';

export default function Home() {
  return (
    <div className="wrap">
      <div className="home-hero">
        <p className="eyebrow">Job costing</p>
        <h1>What are we building today?</h1>
        <p className="lede">Price up a job in minutes — pick the labour and materials, set your markup, get a number to quote.</p>

        <div className="tile-grid">
          <Link href="/estimator" className="tile">
            <p className="tile-icon">01 &middot; estimate</p>
            <h2>Estimator</h2>
            <p>Build a job estimate from labour and materials, with live totals and adjustable markup.</p>
          </Link>
          <Link href="/settings" className="tile">
            <p className="tile-icon">02 &middot; setup</p>
            <h2>Settings</h2>
            <p>Set hourly rates for labour types and unit costs for materials.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
