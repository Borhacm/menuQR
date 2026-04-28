import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TemplatesPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Templates</h1>
      <Tabs defaultValue="classic">
        <TabsList>
          <TabsTrigger value="classic">Classic</TabsTrigger>
          <TabsTrigger value="modern">Modern</TabsTrigger>
          <TabsTrigger value="grid">Grid</TabsTrigger>
        </TabsList>
        {["classic", "modern", "grid"].map((t) => (
          <TabsContent key={t} value={t}>
            <Card>
              <CardHeader>
                <CardTitle>{t} template</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Live template theme controls are available on Resource settings.
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
