import type { ReactElement } from "react";
import {
  Avatar,
  Field,
  FieldContent,
  FieldLabel,
  FieldDescription,
} from "@semoss/ui/next";

export const JobCard = (props: {
  title: string;
  icon: ReactElement;
  count: number;
  iconColor: string;
  avatarColor: string[];
}) => {
  const { title, icon, count, iconColor, avatarColor } = props;

  return (
    <Field className="rounded-md border border-gray-200 p-4">
      <FieldContent className="flex flex-row items-center gap-4"> 
        
        <div className="flex items-center justify-center">
          <Avatar
            className="rounded-sm w-8 h-8"
            style={{
              background: `linear-gradient(45deg, ${avatarColor.join(", ")})`,
            }}
          >
            <div
              className="flex items-center justify-center h-full w-full"
              style={{ color: iconColor }}
            >
              {icon}
            </div>
          </Avatar>
        </div>

        <div className="flex flex-col justify-center">
          <FieldLabel className="text-xs font-medium">
            {title}
          </FieldLabel>
          <FieldDescription className="text-[10px] text-gray-500">
            {count}
          </FieldDescription>
        </div>

      </FieldContent>
    </Field>
  );
};