from generate_context_markdown import generate_context_markdown

if __name__ == "__main__":
    generate_context_markdown(
        project_name="Monster Collection Scripts",
        doc_folders=["docs"],
        exclude_files=["package-lock.json"],
        exclude_folders=[".git", ".husky/_"],
        split_output_if_truncated=True # Set to True to enable multi-file output if truncated
    )