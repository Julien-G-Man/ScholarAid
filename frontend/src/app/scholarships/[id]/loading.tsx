export default function Loading() {
  return (
    <div className="container py-5 placeholder-glow">
      <div className="text-center mb-5">
        <div className="placeholder col-6 mb-3 rounded mx-auto d-block" style={{ height: '2.5rem' }} />
        <div className="placeholder col-3 rounded mx-auto d-block" />
      </div>
      <div className="row p-4 bg-white rounded-4 shadow-sm">
        <div className="col-lg-8">
          <div className="placeholder col-3 mb-3 rounded" />
          <div className="placeholder col-12 mb-2 rounded" />
          <div className="placeholder col-12 mb-2 rounded" />
          <div className="placeholder col-10 mb-5 rounded" />
          <div className="placeholder col-3 mb-3 rounded" />
          <div className="placeholder col-12 mb-2 rounded" />
          <div className="placeholder col-9 rounded" />
        </div>
        <div className="col-lg-4">
          <div className="placeholder col-8 mx-auto d-block mb-4 rounded" style={{ height: '120px' }} />
          <div className="placeholder col-12 mb-2 rounded" />
          <div className="placeholder col-12 mb-2 rounded" />
          <div className="placeholder col-12 mb-2 rounded" />
          <div className="placeholder col-12 rounded" />
        </div>
      </div>
    </div>
  );
}
