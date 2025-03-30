'use client';

export type UserInfo = {
  email: string;
  role: string;
  name: string;
} | null;

export type Task = {
  id: string;
  title: string;
  desc: string;
  date: string;
  assignee: string;
  status: string;
};

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { format } from "date-fns";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import { getApp, getApps, initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBFmvAHgSJsdULbvdtZPh4XxYJAz1WxGfc",
  authDomain: "team-task-system.firebaseapp.com",
  projectId: "team-task-system",
  storageBucket: "team-task-system.appspot.com",
  messagingSenderId: "535484338940",
  appId: "1:535484338940:web:4bbcc51b3a69198ca33d79",
};

// ✅ 避免重複初始化 Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const users = [
  {
    email: "leader@example.com",
    role: "leader",
    name: "老蔣",
  },
  {
    email: "member@example.com",
    role: "member",
    name: "嵐欽"
  },
  {
    email: "member2@example.com",
    role: "member",
    name: "建偉"
  },
  {
    email: "member3@example.com",
    role: "member",
    name: "岩松"
  },
];

export default function TeamTaskApp() {
  const [user, setUser] = useState<UserInfo>(null); // ✅ 加上 as 斷言會在下方 setUser 時使用 // ✅ 加上型別
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDate, setTaskDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState("today");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportTask, setReportTask] = useState<Task | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"complete" | "delete" | null>(null);
  const [targetTaskId, setTargetTaskId] = useState<string | null>(null);



  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const matchedUser = users.find((u) => u.email === userCredential.user.email);
      if (matchedUser) setUser(matchedUser as UserInfo); // ✅ TS 現在會接受這個型別
      else setError("使用者未授權");
    } catch {
      setError("登入失敗，請確認帳號密碼");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const matchedUser = users.find((u) => u.email === firebaseUser.email);
        if (matchedUser) setUser(matchedUser);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const handleAddTask = async () => {
    if (!taskTitle || !taskAssignee) return;
    const newTask = {
      title: taskTitle,
      desc: taskDesc,
      date: taskDate,
      assignee: taskAssignee,
      status: "未完成",
    };
    await addDoc(collection(db, "tasks"), newTask);
    setTaskTitle("");
    setTaskDesc("");
    setTaskAssignee("");
  };

  const handleComplete = async (taskId: string) => {
    const confirmComplete = window.confirm("確定要標註這個任務為完成嗎？");
    if (!confirmComplete) return;
    const taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, { status: "完成" });
  };

  const handleDelete = async (taskId: string) => {
    if (!user || user.role !== "leader") return;
    const confirmDelete = window.confirm("確定要刪除這個任務嗎？");
    if (!confirmDelete) return;
    const taskRef = doc(db, "tasks", taskId);
    await deleteDoc(taskRef);
  }; 

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDesc(task.desc);
    setEditDialogOpen(true);
  };
  
  const openReportDialog = (task: Task) => {
    setReportTask(task);
    setIsReportDialogOpen(true);
  };
  
  const handleSaveEdit = async () => {
    if (!editingTask) return;
    const taskRef = doc(db, "tasks", editingTask.id);
    await updateDoc(taskRef, { title: editTitle, desc: editDesc });
    setEditDialogOpen(false);
  };

  const handleReportTask = async () => {
    if (!reportTask) return;
    const taskRef = doc(db, "tasks", reportTask.id);
    await updateDoc(taskRef, {
      status: reportTask.status || "完成"
    });
    setIsReportDialogOpen(false);
  };

  useEffect(() => {
    if (!user) return;
    const baseQuery = user.role === "leader"
      ? query(collection(db, "tasks"))
      : query(collection(db, "tasks"), where("assignee", "==", user.name));

    const unsubscribe = onSnapshot(baseQuery, (querySnapshot) => {
      const tasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTaskList(tasks); 
    });

    return () => unsubscribe();
  }, [user]);

  const filteredTasks = viewMode === "today"
    ? taskList.filter((t) => t.date === format(new Date(), "yyyy-MM-dd"))
    : taskList;

  const myTasks = user ? filteredTasks.filter((t) => t.assignee === user.name) : [];
   const otherTasks = user ? filteredTasks.filter((t) => t.assignee !== user.name) : [];
  
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="space-y-4 p-6">
            <h1 className="text-xl font-bold text-center">設備應用組登入</h1>
            <Input placeholder="帳號 (Email)" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input type="password" placeholder="密碼" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button className="w-full" onClick={handleLogin}>登入</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-100">
      {/* 編輯任務 Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯任務</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit-title">任務標題</Label>
            <Input id="edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            <Label htmlFor="edit-desc">任務描述</Label>
            <Textarea id="edit-desc" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={handleSaveEdit}>儲存</Button>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{confirmAction === "complete" ? "確認完成任務" : "確認刪除任務"}</DialogTitle>
    </DialogHeader>
    <p className="text-sm text-gray-600">
      {confirmAction === "complete"
        ? "確定要將此任務標記為完成嗎？"
        : "確定要刪除這項任務嗎？此動作無法還原。"}
    </p>
    <DialogFooter className="mt-4">
      <Button
        onClick={async () => {
          if (!targetTaskId) return;
          if (confirmAction === "complete") {
            await handleComplete(targetTaskId);
          } else if (confirmAction === "delete") {
            await handleDelete(targetTaskId);
          }
          setConfirmDialogOpen(false);
        }}
      >
        確認
      </Button>
      <DialogClose asChild>
        <Button variant="outline">取消</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      {/* 回報任務 Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>任務回報</DialogTitle>
        </DialogHeader>
        <div>
          <Label>狀態</Label>
          <select
            value={reportTask?.status || "未完成"}
            onChange={(e) =>
              setReportTask((prev) =>
                prev ? { ...prev, status: e.target.value } : prev
              )
            }
          >
            <option value="未完成">未完成</option>
            <option value="完成">完成</option>
          </select>
        </div>
        <DialogFooter className="mt-4">
        <Button onClick={() => handleReportTask()}>送出</Button>
          <DialogClose asChild>
            <Button variant="outline">取消</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>


      <header className="flex items-center justify-between bg-white p-4 shadow">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">📋 功能選單</h2>
              <Button variant="ghost" className="w-full justify-start py-3 text-base border-b border-gray-300" onClick={() => setViewMode("today")}>📅 今日任務</Button>
              <Button variant="ghost" className="w-full justify-start py-3 text-base border-b border-gray-300" onClick={() => setViewMode("all")}>📃 全部任務</Button>
              <Button variant="ghost" className="w-full justify-start py-3 text-base border-b border-gray-300" onClick={() => window.location.href = "/history"}>🕓 歷史任務</Button>
            </div>
          </SheetContent>
        </Sheet>
        <div className="text-sm flex items-center gap-2">
          👤 {user.name}（{user.role}）
          <Button variant="outline" size="sm" onClick={handleLogout}>登出</Button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {user.role === "leader" && (
          <Card className="p-4 bg-white shadow">
            <h3 className="text-lg font-semibold mb-2">➕ 新增任務</h3>
            <div className="space-y-2">
              <Input placeholder="任務標題" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
              <Textarea placeholder="任務描述" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />
              <Input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} />
              <select
                className="w-full border px-3 py-2 rounded text-sm"
                value={taskAssignee}
                onChange={(e) => setTaskAssignee(e.target.value)}
              >
                <option value="">👤 請選擇指派對象</option>
                {users.filter((u) => u.role === "member").map((member) => (
                  <option key={member.email} value={member.name}>{member.name}</option>
                ))}
              </select>
              <Button onClick={handleAddTask}>新增任務</Button>
            </div>
          </Card>
        )}

        <h2 className="text-xl font-bold">📅 今日任務</h2>

        {user.role === "member" ? (
    <>
      <section>
        <h3 className="text-lg font-semibold mb-2">🧑 我的任務</h3>
        {myTasks.length === 0 ? <p>尚無任務</p> : (
          <ul className="space-y-2">
            {myTasks.map((task) => (
              <li key={task.id} className="bg-white p-3 rounded shadow">
                <div className="font-semibold">{task.title}</div>
                <div className="text-sm text-gray-600">{task.desc}</div>
                <div className="text-xs text-gray-400">📆 {task.date}｜✅ {task.status}</div>
                <div className="mt-2">
                  <Button size="sm" onClick={() => openReportDialog(task)}>回報</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h3 className="text-lg font-semibold mb-2">👥 其他人任務</h3>
        {otherTasks.length === 0 ? <p>無其他人任務</p> : (
          <ul className="space-y-2">
            {otherTasks.map((task) => (
              <li key={task.id} className="bg-white p-3 rounded shadow">
                <div className="font-semibold">{task.title}</div>
                <div className="text-sm text-gray-600">{task.desc}</div>
                <div className="text-xs text-gray-400">📆 {task.date}｜👤 {task.assignee}｜✅ {task.status}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  ) : (
    // Leader 顯示所有任務
    <ul className="space-y-2">
      {filteredTasks.map((task) => (
        <li key={task.id} className="bg-white p-3 rounded shadow">
          <div className="font-semibold">{task.title}</div>
          <div className="text-sm text-gray-600">{task.desc}</div>
          <div className="text-xs text-gray-400">📆 {task.date}｜👤 {task.assignee}｜✅ {task.status}</div>
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={() => openEditDialog(task)}>編輯</Button>
            <Button size="sm" onClick={() => { setConfirmAction("complete"); setTargetTaskId(task.id); setConfirmDialogOpen(true); }}>完成</Button>
            <Button size="sm" onClick={() => { setConfirmAction("delete"); setTargetTaskId(task.id); setConfirmDialogOpen(true); }}>刪除</Button>
          </div>
        </li>
      ))}
    </ul>
  )}
</main>

    </div>
  );
}
