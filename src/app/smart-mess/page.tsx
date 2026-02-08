import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SmartMessPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Smart Mess</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Mess Management System</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            View daily menus, manage your meal preferences, track your consumption, and provide feedback. This section is under construction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
