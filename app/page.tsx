import type { Metadata } from "next";
import OpenLoopInbox from "./OpenLoopInbox";

export const metadata: Metadata = {
  title: "Open Loop Inbox — Every open loop, one inbox",
  description:
    "会議、ChatGPT、Codexに散らばったやり残しを照合し、今判断すべきActionだけを提示します。",
};

export default function Home() {
  return <OpenLoopInbox />;
}
