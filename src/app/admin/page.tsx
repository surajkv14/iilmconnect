import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Control Center</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Manage users, courses, roles, and system settings. This section is for authorized administrators only and is currently under construction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
