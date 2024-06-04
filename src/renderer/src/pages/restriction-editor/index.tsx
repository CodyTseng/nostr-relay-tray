import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@renderer/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@renderer/components/ui/form'
import { Input } from '@renderer/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Switch } from '@renderer/components/ui/switch'
import { ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Rules, { TRule } from './rules'
import { useState } from 'react'

const formSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  action: z.enum(['block', 'allow']),
  enabled: z.boolean()
})
type TFormSchema = z.infer<typeof formSchema>

export default function RestrictionEditor(): JSX.Element {
  const [rules, setRules] = useState<TRule[]>([{ values: [] }])
  const form = useForm<TFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      action: 'block',
      enabled: false
    }
  })

  const onSubmit = form.handleSubmit(async (data) => {
    console.log(data, rules)
  })

  return (
    <>
      <div className="container mx-auto p-2 space-y-4">
        <a href="#/restrictions">
          <Button variant="link" className="p-0">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </a>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rule name</FormLabel>
                  <FormControl>
                    <Input placeholder="Give your rule a descriptive name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a brief description here" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="block">Block</SelectItem>
                      <SelectItem value="allow">Allow</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Rules</FormLabel>
              <Rules rules={rules} setRules={setRules} />
            </FormItem>
            <div className="flex justify-between items-center">
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2">
                      <FormLabel>Enabled</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  )
}
