import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CollabNestPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">CollabNest</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Professional Social Network</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Connect with peers, faculty, and alumni. Build your professional network, showcase your projects, and find opportunities. This section is under construction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
