// services/taskService.ts
import { db } from "@/services/firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import type { Task } from "@/types";

export async function addTask(task: Task) {
  const ref = doc(collection(db, "tasks"), task.id);
  await setDoc(ref, task);
}
