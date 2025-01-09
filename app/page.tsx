import TestGenerator from "@/components/test-generator"
import { Metadata } from "next";

export default function Page() {
  return <TestGenerator />
}

export const metadata: Metadata = {
  title: "Test Scrambler",
  description: "Created by Ankith Prabhakar",
};