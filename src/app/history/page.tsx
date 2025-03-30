// pages/history.tsx
'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import * as XLSX from 'xlsx';
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, signOut } from 'firebase/auth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

const firebaseConfig = {
  apiKey: 'AIzaSyBFmvAHgSJsdULbvdtZPh4XxYJAz1WxGfc',
  authDomain: 'team-task-system.firebaseapp.com',
  projectId: 'team-task-system',
  storageBucket: 'team-task-system.appspot.com',
  messagingSenderId: '535484338940',
  appId: '1:535484338940:web:4bbcc51b3a69198ca33d79',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

interface Task extends DocumentData {
  id: string;
  title: string;
  desc: string;
  date: string;
  assignee: string;
  status: string;
}

export default function HistoryPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserName(parsed.name || '使用者');
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!startDate || !endDate) return;
    const q = query(
      collection(db, 'tasks'),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const list: Task[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(list);
    });
    return () => unsubscribe();
  }, [startDate, endDate]);

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(tasks);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '歷史任務');
    XLSX.writeFile(workbook, '歷史任務.xlsx');
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
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
              <Button variant="ghost" className="w-full justify-start py-3 text-base border-b border-gray-300" onClick={() => (window.location.href = '/')}>📅 今日任務</Button>
              <Button variant="ghost" className="w-full justify-start py-3 text-base border-b border-gray-300" onClick={() => (window.location.href = '/?view=all')}>📃 所有任務</Button>
              <Button variant="ghost" className="w-full justify-start py-3 text-base border-b border-gray-300" onClick={() => (window.location.href = '/history')}>🕓 歷史任務</Button>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-4 text-sm text-gray-700">
          👤 {userName}
          <Button size="sm" variant="outline" onClick={handleLogout}>登出</Button>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow p-4 md:p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1 font-medium">開始日期</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block mb-1 font-medium">結束日期</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={handleExport}>📤 匯出 Excel</Button>
              </div>
            </div>
          </div>

          {tasks.length === 0 ? (
            <p className="text-gray-500 text-center">尚無任務資料</p>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <Card key={task.id} className="p-4 rounded-2xl shadow-md border border-gray-200 bg-white">
                  <div className="text-lg font-semibold mb-1">{task.title}</div>
                  <div className="text-sm text-gray-700 mb-2">{task.desc}</div>
                  <div className="text-xs text-gray-500">
                    📅 {task.date}｜👤 {task.assignee}｜✅ {task.status}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
