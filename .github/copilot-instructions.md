# GitHub Copilot Instructions for `music-collab`

## General Guidelines

### Code Style
- Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) for consistent formatting.
- Use TypeScript features such as interfaces and types for strong type safety.
- Prefer functional components and hooks in React.

### Project-Specific Standards
- Always use `demoid` consistently across all files and ensure it matches the value stored in the Supabase `audiofiles` table.
- Ensure all audio-related operations (upload, fetch, stems) are logged for debugging purposes.
- Use `crypto.randomUUID()` only for generating unique IDs when uploading new audio files.

### Error Handling
- Add meaningful error messages for all `try-catch` blocks.
- Log errors with sufficient context to aid debugging.

### Testing
- Write unit tests for all critical functions, especially those interacting with Supabase.
- Mock Supabase client for testing database operations.

### Performance
- Optimize rendering in React components by using `useMemo` and `useCallback` where applicable.
- Avoid unnecessary re-renders by properly managing dependencies in `useEffect`.

### Security
- Validate all user inputs before processing.
- Avoid exposing sensitive data in logs.

### Documentation
- Add comments to explain complex logic.
- Use JSDoc for documenting functions and interfaces.

### Copilot Usage
- Provide clear function names and comments to guide Copilot.
- Review Copilot suggestions for accuracy and adherence to project standards.

## Example Code Snippets

### Fetch Audio Files
```typescript
const fetchAudioFiles = async () => {
  try {
    const { data, error } = await supabase.storage.from("audio").list();
    if (error) throw error;

    const audioFiles = data.map((file) => ({
      demoid: crypto.randomUUID(),
      filename: file.name,
      url: supabase.storage.from("audio").getPublicUrl(file.name).data.publicUrl,
    }));

    set({ audioFiles });
  } catch (error) {
    console.error("Failed to fetch audio files:", error);
  }
};
```

### Upload Stems
```typescript
const handleUploadStems = async (demoid: string, files: FileList) => {
  if (!demoid) {
    console.error("Invalid demoid: Ensure it is passed correctly from the parent component.");
    return;
  }

  console.log("🔍 Checking demoid:", demoid);

  const { data: demoData, error: demoError } = await supabase
    .from("audiofiles")
    .select("demoid")
    .eq("demoid", demoid);

  if (demoError) {
    console.error("Error verifying demoid:", demoError);
    return;
  }

  if (!demoData || demoData.length === 0) {
    console.error("demoid does not exist in audiofiles table:", demoid);
    return;
  }

  console.log("✅ demoid exists in audiofiles table:", demoid);

  const stemsMetadata = [];

  for (const file of Array.from(files)) {
    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}_${cleanName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("audio")
      .upload(filename, file);

    if (uploadError) {
      console.error("Error uploading stem file:", uploadError);
      continue;
    }

    const { data: urlData } = supabase.storage
      .from("audio")
      .getPublicUrl(filename);

    stemsMetadata.push({ name: file.name, url: urlData.publicUrl });
  }

  console.log("Stems metadata before database update:", stemsMetadata);

  const { error: updateError } = await supabase
    .from("audiofiles")
    .update({ stems: stemsMetadata })
    .eq("demoid", demoid);

  if (updateError) {
    console.error("Error updating stems metadata:", updateError);
  } else {
    console.log("✅ Stems metadata updated successfully");
  }
};
```

By following these guidelines, Copilot can better assist in generating code that aligns with your project's requirements.
