import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../registry/bedrock/ui/dialog'
import { Checkbox } from '../../registry/bedrock/ui/checkbox'
import { Label } from '../../registry/bedrock/ui/label'
import { Switch } from '../../registry/bedrock/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../registry/bedrock/ui/tabs'

/**
 * shadcn's own components, with Radix swapped for bedrock, imported from the
 * registry directory unmodified — the same files `npx shadcn add` serves.
 *
 * That is the point of showing them. The claim the registry makes is that the
 * swap is invisible: same exports, same class names, same look. A screenshot
 * cannot support that claim and a rewritten copy would not be evidence of it.
 * These are the shipped files, rendered.
 */
export default function RegistryDemo() {
  return (
    <div className="registry-demo w-full space-y-6">
      <Tabs defaultValue="account" className="w-full">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4 pt-4">
          <Dialog>
            <DialogTrigger className="border-input bg-background hover:bg-accent inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium">
              Delete account
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete account?</DialogTitle>
                <DialogDescription>
                  Every project and deployment goes with it. This cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose className="border-input hover:bg-accent inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium">
                  Keep it
                </DialogClose>
                <button className="bg-destructive text-destructive-foreground inline-flex h-9 items-center rounded-md px-4 text-sm font-medium">
                  Delete
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 pt-4">
          <div className="flex items-center gap-3">
            <Checkbox id="registry-email" defaultChecked />
            <Label htmlFor="registry-email">Email me when a deploy fails</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="registry-weekly" />
            <Label htmlFor="registry-weekly">Weekly summary</Label>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
