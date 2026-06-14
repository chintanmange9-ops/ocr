export default function ProgressIndicator() {
  return (
    <div className="processing-overlay">
      <div className="processing-box">
        <div className="spinner" />
        <h3>Processing your document</h3>
        <p>This may take a moment</p>
      </div>
    </div>
  );
}
