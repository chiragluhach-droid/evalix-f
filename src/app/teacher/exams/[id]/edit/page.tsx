'use client';

import { useParams } from 'next/navigation';
import ExamEditor from '@/components/ExamEditor';

export default function EditExam() {
  const { id } = useParams<{ id: string }>();
  return <ExamEditor examId={id} />;
}
