import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Auto } from '@prisma/client';

export function AutoEditForm({ auto, onSubmit, onCancel }: { 
  auto: Auto, 
  onSubmit: (data: any) => void,
  onCancel: () => void 
}) {
  const form = useForm({
    defaultValues: {
      spz: auto.spz || '',
      znacka: auto.znacka || '',
      model: auto.model || '',
      rokVyroby: auto.rokVyroby || '',
      najezd: auto.najezd || '',
      stav: auto.stav || 'aktivní',
      datumSTK: auto.datumSTK ? new Date(auto.datumSTK).toISOString().substring(0, 10) : '',
      poznamka: auto.poznamka || ''
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="spz"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SPZ</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Zrušit
          </Button>
          <Button type="submit">
            Uložit změny
          </Button>
        </div>
      </form>
    </Form>
  );
} 