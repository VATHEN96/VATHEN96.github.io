/**
 * Extracts a numeric ID from various campaign ID formats.
 * 
 * Handles the following formats:
 * - Pure numeric: "0", "1", etc.
 * - Standard format: "CAMP-0-xxxxxx-xxxxxx"
 * - Alternative format: "0-xxxxxx-xxxxxx"
 * - Fallback: Attempts to extract the first numeric portion from any string
 * 
 * @param id The campaign ID string to process
 * @returns The numeric ID as a number or null if no valid ID can be extracted
 */
export default function extractNumericId(id: string): number | null {
  if (!id) return null;
  
  // Trim any whitespace
  const trimmedId = id.trim();
  console.log("extractNumericId processing:", trimmedId);
  
  // Handle any campaign 0 formatted ID with CAMP-0 prefix
  if (/CAMP-0-[\w-]+/i.test(trimmedId)) {
    console.log("Matched CAMP-0-* pattern, returning 0");
    return 0;
  }
  
  // List of known campaign 0 IDs for explicit matches
  const knownCamp0Ids = [
    'CAMP-0-046394-ea31cd',
    'CAMP-0-634478-aa31cd',
    'CAMP-0-933214-ea31cd',
    'camp-0-046394-ea31cd',
    'camp-0-634478-aa31cd',
    'camp-0-933214-ea31cd'
  ];
  
  if (knownCamp0Ids.includes(trimmedId.toLowerCase())) {
    console.log("Found exact match in known campaign 0 IDs");
    return 0;
  }
  
  // If it's already a numeric string, convert and return
  if (/^\d+$/.test(trimmedId)) {
    const numericId = parseInt(trimmedId, 10);
    console.log("Found numeric ID:", numericId);
    return numericId;
  }
  
  // For any CAMP-X-Y-Z format (the standard format)
  // This regex extracts the numeric ID (second component) from formats like CAMP-0-xxxxxx-xxxxx
  const campFormatMatch = trimmedId.match(/CAMP-(\d+)/i);
  if (campFormatMatch && campFormatMatch[1]) {
    const numericId = parseInt(campFormatMatch[1], 10);
    console.log("Extracted numeric ID from CAMP format:", numericId);
    return numericId;
  }
  
  // Alternative format: just in case it's missing the CAMP prefix
  // This handles 0-xxxxxx-xxxxx format
  const altFormatMatch = trimmedId.match(/^(\d+)-[\w-]+/);
  if (altFormatMatch && altFormatMatch[1]) {
    const numericId = parseInt(altFormatMatch[1], 10);
    console.log("Extracted numeric ID from alternative format:", numericId);
    return numericId;
  }
  
  // Check for campaign keyword followed by a number
  const campaignKeywordMatch = trimmedId.match(/campaign[^\d]*(\d+)/i);
  if (campaignKeywordMatch && campaignKeywordMatch[1]) {
    const numericId = parseInt(campaignKeywordMatch[1], 10);
    console.log("Extracted numeric ID from campaign keyword:", numericId);
    return numericId;
  }
  
  // Last resort: extract any number as potential ID
  const matches = trimmedId.match(/\d+/g);
  if (matches && matches.length > 0) {
    const numericId = parseInt(matches[0], 10);
    console.log("Extracted first numeric part:", numericId);
    return numericId;
  }
  
  console.log("Could not extract numeric ID from:", trimmedId);
  return null;
} 