import DevNavbar from './DevNavbar';

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-gray-950">
      <DevNavbar />
      <main className="mx-auto max-w-6xl p-4">{children}</main>
    </div>
  );
}
