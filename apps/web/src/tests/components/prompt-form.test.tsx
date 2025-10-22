import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PromptForm } from "@/components/projects/PromptForm";

// Mock the stores
vi.mock("@/stores/projects", () => ({
  useProjectsStore: () => ({
    create: vi.fn(),
    isLoading: false,
  }),
}));

describe("PromptForm", () => {
  it("renders form fields", () => {
    render(<PromptForm />);
    
    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/project prompt/i)).toBeInTheDocument();
  });

  it("shows validation errors", async () => {
    render(<PromptForm />);
    
    const submitButton = screen.getByRole("button", { name: /create project/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name must be at least 3 characters/i)).toBeInTheDocument();
    });
  });

  it("populates form with example", () => {
    render(<PromptForm />);
    
    const exampleButton = screen.getAllByRole("button")[1]; // First example
    fireEvent.click(exampleButton);

    const promptField = screen.getByLabelText(/project prompt/i) as HTMLTextAreaElement;
    expect(promptField.value).toBeTruthy();
  });
});

