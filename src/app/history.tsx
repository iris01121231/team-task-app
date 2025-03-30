// pages/history.tsx
'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyBFmvAHgSJsdULbvdtZPh4XxYJAz1WxGfc',
  authDomain: 'team-task-system.firebaseapp.com',
  projectId: 'team-task-system',
  storageBucket: 'team-task-system.appspot.com',
  messagingSenderId: '535484338940',
  appId: '1:535484338940:web:4bbcc51b3a69198ca33d79',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function HistoryPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!startDate || !endDate) return;

    const q = query(
      collection(db, 'tasks'),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">📜 歷史任務查詢</h1>

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
    </div>
  );
}