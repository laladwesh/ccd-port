// A shell command in the accent colour, then the title as an inverted ink block.
const SectionHeading = ({ command, title }) => (
  <header className="section-heading">
    <p className="sh-cmd">{command}</p>
    <h1 className="sh-title">{title}</h1>
  </header>
);

export default SectionHeading;
