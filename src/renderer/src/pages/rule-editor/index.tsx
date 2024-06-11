import { RULE_ACTION, TRuleCondition } from '@common/rule'
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
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { z } from 'zod'
import RuleConditions from './rule-conditions'

const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .regex(/^[a-zA-Z0-9-]+$/, 'Only alphanumeric characters and hyphens are allowed'),
  description: z.string().optional(),
  action: z.enum(['block', 'allow']),
  enabled: z.boolean()
})
type TFormSchema = z.infer<typeof formSchema>

export default function RuleEditor(): JSX.Element {
  const { id } = useParams<{ id?: string }>()
  const [ruleId, setRuleId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [ruleConditions, setRuleConditions] = useState<TRuleCondition[]>([{ values: [] }])
  const form = useForm<TFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      action: RULE_ACTION.BLOCK,
      enabled: false
    }
  })

  const init = async () => {
    if (!id) return

    const idNumber = parseInt(id)
    if (isNaN(idNumber)) return

    const rule = await window.api.rule.findById(idNumber)
    if (!rule) return

    setRuleId(idNumber)
    form.reset({
      name: rule.name,
      description: rule.description ?? '',
      action: rule.action,
      enabled: rule.enabled
    })
    setRuleConditions(rule.conditions)
  }

  useEffect(() => {
    init()
  }, [])

  const onSubmit = form.handleSubmit(async (data) => {
    setSaving(true)

    if (ruleId) {
      await window.api.rule.update(ruleId, {
        ...data,
        conditions: ruleConditions
      })
    } else {
      await window.api.rule.create({
        ...data,
        conditions: ruleConditions
      })
    }
    window.location.href = '#/restrictions'
  })

  return (
    <div className="space-y-4">
      <a href="#/restrictions">
        <Button variant="link" className="p-0">
          <ArrowLeft size={16} className="mr-1" />
          Back
        </Button>
      </a>
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-2">
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={RULE_ACTION.BLOCK}>Block</SelectItem>
                    <SelectItem value={RULE_ACTION.ALLOW}>Allow</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>Conditions</FormLabel>
            <RuleConditions conditions={ruleConditions} setConditions={setRuleConditions} />
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
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
