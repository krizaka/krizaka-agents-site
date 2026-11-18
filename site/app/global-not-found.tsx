import "./globals.css";

export const metadata = { title: "404 · Krizaka Agents" };

/* One 404 for both languages (they are two root layouts), so it carries its own document. */
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <div className="kz-404">
          <h1>404</h1>
          <p>This page does not exist · Cette page n'existe pas</p>
          <p>
            <a href="/">Krizaka Agents</a> · <a href="/fr/">Français</a>
          </p>
        </div>
      </body>
    </html>
  );
}
