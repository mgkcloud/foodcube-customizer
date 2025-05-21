import React from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

const HeightSwitch: React.FC = () => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="flex items-center justify-end gap-2 text-gray-600">
        <Switch id="height-switch" checked disabled className="scale-90" />
        <Label htmlFor="height-switch" className="text-xs">500mm Standard Height</Label>
      </div>
    </TooltipTrigger>
    <TooltipContent side="top" className="text-xs">
      Only the standard 500mm height is available
    </TooltipContent>
  </Tooltip>
)

export default HeightSwitch
