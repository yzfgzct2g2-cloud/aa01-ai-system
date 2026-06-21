import "./common.css";

export function EmptyState({ message = "無資料" }: { message?: string }) {
  return <p className="ui-empty">{message}</p>;
}
