import { HUBS, hubHref } from "../hubs";

// Static status line. The build date is injected at build time (vite.config.js).
const Footer = ({ hub }) => {
  const other = HUBS[hub.other];
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p>
          {hub.rack} / build {__BUILD_DATE__} / {hub.host}
        </p>
        <a href={hubHref(other.key)}>{other.rack} &rarr;</a>
      </div>
    </footer>
  );
};

export default Footer;
