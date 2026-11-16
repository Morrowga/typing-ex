import App from "@/components/App";
import { getLessons } from "@/lib/lessons";

export default function Home() {
  return <App lessons={getLessons()} />;
}
