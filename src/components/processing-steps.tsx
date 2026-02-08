"use client";

import React from "react";
import { CheckCircle, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProcessingStatus } from "@/types";

interface Step {
  id: ProcessingStatus;
  label: string;
  description: string;
}

const steps: Step[] = [
  {
    id: "parsing",
    label: "Parse File",
    description: "Reading and parsing your spreadsheet",
  },
  {
    id: "validating",
    label: "Validate",
    description: "AI-powered content validation",
  },
  {
    id: "mapping",
    label: "Map Fields",
    description: "Configure field mappings",
  },
  {
    id: "importing",
    label: "Import",
    description: "Creating entries in Contentful",
  },
  {
    id: "complete",
    label: "Complete",
    description: "Import finished",
  },
];

interface ProcessingStepsProps {
  currentStatus: ProcessingStatus;
  error?: string;
}

export function ProcessingSteps({ currentStatus, error }: ProcessingStepsProps) {
  const getStepState = (step: Step): "complete" | "current" | "pending" | "error" => {
    const stepOrder = steps.map((s) => s.id);
    const currentIndex = stepOrder.indexOf(currentStatus);
    const stepIndex = stepOrder.indexOf(step.id);

    if (currentStatus === "error" && stepIndex === currentIndex) {
      return "error";
    }

    if (stepIndex < currentIndex) return "complete";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  return (
    <div className="w-full py-4">
      <nav aria-label="Progress">
        <ol className="flex items-center justify-between">
          {steps.map((step, index) => {
            const state = getStepState(step);

            return (
              <li key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                      state === "complete" && "bg-primary border-primary",
                      state === "current" && "border-primary bg-primary/10",
                      state === "pending" && "border-muted-foreground/30 bg-muted",
                      state === "error" && "border-destructive bg-destructive/10"
                    )}
                  >
                    {state === "complete" && (
                      <CheckCircle className="w-6 h-6 text-primary-foreground" />
                    )}
                    {state === "current" && (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    )}
                    {state === "pending" && (
                      <Circle className="w-5 h-5 text-muted-foreground/50" />
                    )}
                    {state === "error" && (
                      <span className="text-destructive font-bold">!</span>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        state === "complete" && "text-primary",
                        state === "current" && "text-primary",
                        state === "pending" && "text-muted-foreground",
                        state === "error" && "text-destructive"
                      )}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-[100px]">
                      {step.description}
                    </p>
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-4 -mt-8",
                      getStepState(steps[index + 1]) === "complete" ||
                        getStepState(step) === "complete"
                        ? "bg-primary"
                        : "bg-muted"
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {error && (
        <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
