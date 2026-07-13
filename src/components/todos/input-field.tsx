"use client";

import * as React from "react";
import Textarea from "jt-design-system/es/textarea";
import Button from "jt-design-system/es/button";
import * as API from "@/services/api";
import styles from "./input-field.module.css";

type Props = {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onTodoCreated: () => Promise<void>;
};

export default function InputField({
  loading,
  setLoading,
  onTodoCreated,
}: Props) {
  const [content, setContent] = React.useState("");

  const submit = React.useCallback(
    async (e?: React.SubmitEvent) => {
      if (loading || !content.trim()) {
        return;
      }

      e?.preventDefault();

      setLoading(true);
      try {
        await API.createTodo(content);
        await onTodoCreated();
        setContent("");
      } finally {
        setLoading(false);
      }
    },
    [content, loading, onTodoCreated, setLoading],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <form className={styles.container} onSubmit={submit}>
      <div className={styles.helper}>submit: cmd/ctrl+enter</div>
      <Textarea
        id="todo-input"
        className={styles.field}
        value={content}
        onValueChange={setContent}
        onKeyDown={handleKeyDown}
        placeholder="Add a new todo..."
        autoFocus
      />
      <Button
        type="submit"
        className={styles.submit}
        disabled={loading || !content.trim()}
      >
        Add
      </Button>
    </form>
  );
}
