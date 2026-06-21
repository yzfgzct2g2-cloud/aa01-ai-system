import { APP_VERSION, LAST_UPDATE } from "../../config/version";
import "./common.css";

export function AppHeader() {
  return (
    <header className="app-header">
      <h1 className="app-header__title">AA01 AI 照顧計畫系統</h1>
      <div className="app-header__meta">
        <span className="app-header__brand">AA01 AI System</span>
        <span className="badge badge-muted">v{APP_VERSION}</span>
        <span className="app-header__update">Last Update: {LAST_UPDATE}</span>
      </div>
    </header>
  );
}
