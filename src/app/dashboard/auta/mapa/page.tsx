import { redirect } from 'next/navigation';

// Redirect GPS Sledování page to Opravy page
export default function VehicleMapPage() {
  redirect('/dashboard/opravy');
} 