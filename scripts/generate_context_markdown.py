import os
from pathlib import Path
from datetime import datetime
import re
from typing import List, Tuple, Optional

def generate_context_markdown(
    output_filename: str = "output/project_context.md",
    project_name: str = "Unnamed Project",
    readme_filename: str = "README.md",
    ai_instructions_filename: str = "docs/ai_instructions.md",
    optional_docs: Optional[List[str]] = None,
    doc_folders: Optional[List[str]] = None,
    exclude_files: Optional[List[str]] = None,
    exclude_folders: Optional[List[str]] = None,
    max_output_characters: int = 500000,
    split_output_if_truncated: bool = False
):
    """
    Combines project information and code files into a single Markdown file(s)
    for AI context preservation.
    
    Args:
        output_filename (str): The base name of the output Markdown file(s).
        project_name (str): The name of the project.
        readme_filename (str): The filename of the project's README.
        ai_instructions_filename (str): The filename containing AI assistant instructions.
        optional_docs (Optional[List[str]]): A list of paths to specific markdown files
                                             to include in the preamble.
        doc_folders (Optional[List[str]]): A list of directory paths to scan for
                                           .md files to include in the preamble.
        exclude_files (Optional[List[str]]): A list of specific file paths to exclude
                                             from the context.
        exclude_folders (Optional[List[str]]): A list of directory paths to exclude
                                               from the context.
        max_output_characters (int): The maximum approximate character limit for each output file.
                                     Content will be truncated if this limit is exceeded.
        split_output_if_truncated (bool): If True, when truncation occurs, the output will
                                          be split into multiple numbered files (e.g.,
                                          project_context_part_1.md, project_context_part_2.md).
                                          If False, only one file will be generated and truncated.
    """
    project_root = Path(__file__).parent.parent
    
    # --- Process exclusion lists for efficient lookup ---
    files_to_exclude_set = {Path(p) for p in exclude_files} if exclude_files else set()
    folders_to_exclude_set = {Path(p) for p in exclude_folders} if exclude_folders else set()
    
    # --- Gather all documentation files from both lists ---
    all_doc_paths = set()
    if optional_docs:
        all_doc_paths.update(optional_docs)
    
    if doc_folders:
        for folder_str in doc_folders:
            doc_folder_path = project_root / folder_str
            if doc_folder_path.is_dir():
                # Recursively find all markdown files in the folder
                for md_file in doc_folder_path.glob('**/*.md'):
                    relative_path_str = str(md_file.relative_to(project_root)).replace("\\", "/")
                    all_doc_paths.add(relative_path_str)

    # --- SECTION 1: Project Overview (from README.md) ---
    readme_path = project_root / readme_filename
    readme_content = ""
    if readme_path.exists():
        readme_content = readme_path.read_text(encoding="utf-8")
    else:
        readme_content = f"## Project Overview\n\n`{readme_filename}` not found. Please create one with project description."

    # --- SECTION 2: Instructions for AI Assistant (from ai_instructions.md) ---
    ai_instructions_path = project_root / ai_instructions_filename
    ai_instructions_content = ""
    if ai_instructions_path.exists():
        ai_instructions_content = ai_instructions_path.read_text(encoding="utf-8")
    else:
        ai_instructions_content = f"## Instructions for AI Assistant\n\n`{ai_instructions_filename}` not found. Please create one with instructions for the AI assistant."
    
    # --- SECTION 3: Optional Supplemental Documents ---
    optional_docs_content_list = []
    sorted_doc_paths = sorted(list(all_doc_paths)) # Sort for consistent order
    for doc_path_str in sorted_doc_paths:
        doc_path = project_root / doc_path_str
        if doc_path.exists():
            # Add a header for the document based on its filename
            doc_title = Path(doc_path_str).stem.replace('_', ' ').title()
            optional_docs_content_list.append(f"## {doc_title}\n\n")
            optional_docs_content_list.append(doc_path.read_text(encoding="utf-8"))
            optional_docs_content_list.append("\n\n")
    
    optional_docs_str = "".join(optional_docs_content_list)

    # --- Build a set of all files that are part of the preamble to avoid duplicating them ---
    preamble_files_to_ignore = {Path(p) for p in [readme_filename, ai_instructions_filename]}
    preamble_files_to_ignore.update({Path(p) for p in all_doc_paths})


    # Function to parse .gitignore and return a list of regex patterns
    def get_gitignore_patterns(gitignore_path: Path) -> List[Tuple[re.Pattern, bool]]:
        patterns = []
        if gitignore_path.exists():
            with open(gitignore_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue
                    
                    is_negated = line.startswith('!')
                    if is_negated:
                        line = line[1:] # Remove '!'
                    
                    # Convert .gitignore patterns to regex
                    # Escape special characters that are not * or ?
                    pattern_str = re.escape(line)
                    # Convert * to .* (any characters)
                    pattern_str = pattern_str.replace(r'\*', '.*')
                    # Convert ? to . (any single character)
                    pattern_str = pattern_str.replace(r'\?', '.')
                    
                    # Handle directory patterns (ending with /)
                    if line.endswith('/'):
                        # Match directory itself and its contents
                        pattern_str += '.*' 
                    # If pattern is just a name (e.g., 'foo'), it matches files and dirs named 'foo' anywhere
                    elif '/' not in line:
                         pattern_str = f"(^|.*/){pattern_str}" 
                    
                    # Handle anchoring to project root (patterns starting with '/')
                    if line.startswith('/'):
                        pattern_str = pattern_str.lstrip(r'\/') # Remove escaped leading slash
                        pattern_str = f"^{pattern_str}" # Anchor to start of relative path
                    
                    patterns.append((re.compile(pattern_str), is_negated))
        return patterns

    # Get .gitignore patterns
    gitignore_path = project_root / ".gitignore"
    ignore_patterns = get_gitignore_patterns(gitignore_path)

    
    # Function to check if a file path should be ignored
    def should_ignore(relative_path: Path) -> bool:
        path_str = str(relative_path).replace("\\", "/") # Standardize path separators
        
        # --- Check against all exclusion criteria ---

        # 1. Ignore generated output files, the script itself, or preamble docs
        if Path(output_filename).stem in path_str or \
           relative_path == Path(__file__).relative_to(project_root) or \
           relative_path in preamble_files_to_ignore:
            return True

        # 2. Ignore files in the explicit exclusion list
        if relative_path in files_to_exclude_set:
            return True

        # 3. Ignore paths within any of the excluded folders
        for excluded_folder in folders_to_exclude_set:
            # Check if the path is the folder itself or is inside the folder
            if excluded_folder in relative_path.parents or relative_path == excluded_folder:
                return True

        # 4. Check against .gitignore patterns
        final_decision_is_ignored = False
        for pattern_regex, is_negated in ignore_patterns:
            # Check if the full relative path matches the pattern
            if pattern_regex.fullmatch(path_str):
                if is_negated:
                    final_decision_is_ignored = False # A negation overrides previous ignores
                else:
                    final_decision_is_ignored = True # An ignore pattern matches
            # If the pattern doesn't contain a slash, check if it matches the basename
            elif '/' not in pattern_regex.pattern.replace(r'.\*', ''): # Check original pattern part
                 if pattern_regex.fullmatch(os.path.basename(path_str)):
                    if is_negated:
                        final_decision_is_ignored = False
                    else:
                        final_decision_is_ignored = True

        return final_decision_is_ignored

    # Walk the project directory to find all files that *could* be included
    all_eligible_code_files: List[str] = []
    for dirpath, dirnames, filenames in os.walk(project_root):
        current_relative_dir = Path(dirpath).relative_to(project_root)

        # Filter out ignored directories *before* walking into them
        # Create a copy of dirnames to iterate over while modifying the original list
        dirs_to_process = dirnames[:] 
        dirnames.clear() # Clear original list to fill with allowed ones

        for dname in dirs_to_process:
            relative_dir_path = current_relative_dir / dname
            if should_ignore(relative_dir_path):
                continue
            dirnames.append(dname)

        for filename in filenames:
            file_absolute_path = Path(dirpath) / filename
            file_relative_path = file_absolute_path.relative_to(project_root)
            
            if not should_ignore(file_relative_path):
                all_eligible_code_files.append(str(file_relative_path).replace("\\", "/"))

    all_eligible_code_files.sort() # Sort all eligible files for consistent ordering
    num_of_eligible_files = len(all_eligible_code_files)

    # --- Build the initial fixed content sections ---
    generation_timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    initial_content_template = f"""
# Project Context for AI Assistant - {project_name}

**Generated On:** {generation_timestamp}

This document consolidates all necessary information for an AI assistant to understand the "{project_name}" project. It includes the project overview, AI instructions, supplemental documentation (if any), and the full current codebase.

{readme_content}

{ai_instructions_content}

{optional_docs_str}
## Current Codebase Files

"""
    # Define a smaller header for subsequent parts.
    subsequent_part_header = f"""
# Project Context for AI Assistant - {project_name} (Continued)

**Generated On:** {generation_timestamp}

This document is a continuation of the project codebase. Please ensure all parts have been provided.

## Current Codebase Files (Continued)

"""
    
    current_part_number = 1
    current_content_for_part = []
    code_files_included_in_current_part = [] # Files only for the current part
    all_files_included_across_parts = [] # All files included in total
    
    def write_part_file(part_num, content_list, is_truncated=False, total_parts=1, total_files_overall=0, files_in_this_part=0):
        """
        Constructs and writes a single part of the project context to a file.
        
        This function handles the naming of the file (e.g., adding _part_X),
        adding relevant headers and warnings, and printing a summary of the
        generated file to the console.

        Args:
            part_num (int): The number of this part (e.g., 1, 2).
            content_list (list): A list of strings containing the Markdown-formatted
                                 code content for this part.
            is_truncated (bool, optional): If True, a warning is added to indicate
                                           that not all files could be included. 
                                           Defaults to False.
            total_parts (int, optional): The total number of parts being generated.
                                         Used for the "Part X of Y" header. 
                                         Defaults to 1.
            total_files_overall (int, optional): The total number of eligible files
                                                 in the project. Used in the 
                                                 truncation warning. Defaults to 0.
            files_in_this_part (int, optional): The number of files included in
                                                this specific part. Used in the
                                                truncation warning. Defaults to 0.
        """
        # Determine the output filename for the current part
        if total_parts > 1:
            part_output_filename = Path(output_filename).stem + f"_part_{str(part_num)}" + Path(output_filename).suffix
        else:
            part_output_filename = output_filename

        part_header_warning = ""
        if total_parts > 1:
            part_header_warning = f"\n---\n**This is Part {str(part_num)} of {str(total_parts)} of the project context.** Please ensure you provide *all* parts to the AI for complete context. Start with Part 1.\n---\n"
        
        truncation_warning = ""
        if is_truncated:
            truncation_warning = f"\n---\n**WARNING: Not all code files could be included in this part due to the `max_output_characters` limit ({str(max_output_characters)} characters).**\n"
            truncation_warning += f"Only {str(files_in_this_part)} code files are present in this part.\n"
            if total_parts == 1: # Only mention total eligible if it's the only part
                 truncation_warning += f"The project has a total of {str(total_files_overall)} eligible code files.\n"
            truncation_warning += f"Consider increasing `max_output_characters` or utilizing the multi-file output option.\n"
            truncation_warning += f"---\n"

        # Choose the correct header content based on the part number
        header_content = initial_content_template if part_num == 1 else subsequent_part_header
        full_part_content = header_content + "".join(content_list) + truncation_warning + part_header_warning
        
        # Ensure the output directory exists before writing the file.
        full_output_path = project_root / part_output_filename
        full_output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(full_output_path, "w", encoding="utf-8") as f:
            f.write(full_part_content.strip())
        
        print(f"Successfully generated '{part_output_filename}' in the project root directory.")
        print(f"Characters in '{full_output_path}': {len(full_part_content.strip())}")
        print(f"Code files in this part: {str(files_in_this_part)}")
        
        # Clear for next part
        content_list.clear()
        code_files_included_in_current_part.clear()
        
    
    current_length_of_part = len(initial_content_template) # Start with the length of the main preamble for Part 1

    # --- Add codebase files up to the limit ---
    for file_path_str in all_eligible_code_files:
        file_path = project_root / file_path_str
        if file_path.exists():
            lang = "text"
            if file_path_str.endswith(".py"):
                lang = "python"
            elif file_path_str.endswith(".json"):
                lang = "json"
            elif file_path_str.endswith(".md"):
                lang = "markdown"
            elif file_path_str == ".gitignore":
                lang = "text"
            
            # Handle non-text (binary) files gracefully
            try:
                file_content = file_path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                print(f"  [Warning] Skipping non-UTF-8 file: {file_path_str}")
                # Use a placeholder for binary files
                file_content = "[Content not included: File is not UTF-8 encoded, likely binary]"
                lang = "text" # Ensure it's treated as plain text
            
            # Estimate the size of this file's markdown block
            # Add 20 for markdown headers, backticks, newlines (approx)
            block_size = len(f"### File: `{file_path_str}`\n\n```{lang}\n{file_content}\n```\n\n")

            # Check if adding this file exceeds the limit for the current part
            if current_length_of_part + block_size > max_output_characters:
                if split_output_if_truncated:
                    # Write the current part and start a new one
                    write_part_file(
                        current_part_number, 
                        current_content_for_part, 
                        is_truncated=True, 
                        total_parts=current_part_number, # Will be updated for next part
                        total_files_overall=num_of_eligible_files,
                        files_in_this_part=len(code_files_included_in_current_part)
                    )
                    current_part_number += 1
                    # CRITICAL: Reset length for the new part using the smaller header
                    current_length_of_part = len(subsequent_part_header) 
                else:
                    # If not splitting, just truncate and exit loop
                    print(f"Stopping content generation for a single file due to character limit ({str(max_output_characters)}).")
                    break # Stop adding files

            current_content_for_part.append(f"### File: `{file_path_str}`\n\n")
            current_content_for_part.append(f"```{lang}\n")
            current_content_for_part.append(file_content)
            current_content_for_part.append(f"\n```\n\n")
            
            current_length_of_part += block_size
            all_files_included_across_parts.append(file_path_str) # Track all files
            code_files_included_in_current_part.append(file_path_str) # Track files in current part
        else:
            # This case indicates a file listed by os.walk did not exist when read
            error_msg = f"### File: `{file_path_str}` - NOT FOUND (Error: File disappeared after scan)\n\n"
            current_content_for_part.append(error_msg)
            current_length_of_part += len(error_msg)
    
    # Write the last part if there's any content left
    if current_content_for_part:
        is_final_part_truncated = (len(all_files_included_across_parts) < num_of_eligible_files) and not split_output_if_truncated
        write_part_file(
            current_part_number, 
            current_content_for_part, 
            is_truncated=is_final_part_truncated, 
            total_parts=current_part_number,
            total_files_overall=num_of_eligible_files,
            files_in_this_part=len(code_files_included_in_current_part)
        )

    # --- FINAL SUMMARY REPORT ---
    print("\n--- Summary of Generated Context ---")
    
    # List all documentation files that were included in the preamble.
    print(f"\n--- Documentation Files Included in Preamble ({str(len(sorted_doc_paths))}) ---")
    if sorted_doc_paths:
        for doc_path in sorted_doc_paths:
            print(f"- {doc_path}")
    else:
        print("No optional documentation files were found or included.")
    print("------------------------------------------")

    # List all codebase files that were included.
    print(f"\n--- Codebase Files Included ({str(len(all_files_included_across_parts))}/{str(num_of_eligible_files)}) ---")
    if all_files_included_across_parts:
        for file_path_str in all_files_included_across_parts:
            print(f"- {file_path_str}")
        if len(all_files_included_across_parts) < num_of_eligible_files:
            print(f"... and {str(num_of_eligible_files - len(all_files_included_across_parts))} more files were omitted due to character limit.")
    else:
        print("No codebase files were included (either none found or all filtered/truncated).")
    print("------------------------------------------\n")
    

    print("Please review the content.")
    if current_part_number > 1:
        print(f"\nIMPORTANT: Multiple files were generated: {Path(output_filename).stem}_part_1.md through {Path(output_filename).stem}_part_{str(current_part_number)}.md.")
        print("When starting a new conversation with an AI, you MUST copy the *entire content* of **ALL** generated parts, one after the other, into the prompt.")
        print("Start with Part 1, then Part 2, and so on.")
    else:
        print("\nWhen starting a new conversation with an AI, copy the *entire content* of this file into the prompt.")