// «Как играть» из шапки по «?». При первом запуске те же правила показывает экран дня.
import { useRouter } from 'expo-router';

import { HowToBody } from '@/components/how-to-body';

export default function HowTo() {
  const router = useRouter();
  return <HowToBody onDone={() => router.back()} />;
}
