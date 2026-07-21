export function parseSpanishName(fullName: string): { nombres: string, ape1: string, ape2: string } {
  const cleanName = fullName.trim().replace(/\s+/g, ' ');
  const parts = cleanName.split(' ');
  
  const compoundPrefixes = ['DE', 'DEL', 'LA', 'LAS', 'LOS', 'Y', 'SAN', 'SANTA', 'MAC', 'MC', 'VON', 'VAN'];
  
  // Group compound parts together
  const groupedParts: string[] = [];
  let currentGroup = '';
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const upperPart = part.toUpperCase();
    
    if (compoundPrefixes.includes(upperPart)) {
      currentGroup = currentGroup ? `${currentGroup} ${part}` : part;
    } else {
      currentGroup = currentGroup ? `${currentGroup} ${part}` : part;
      groupedParts.push(currentGroup);
      currentGroup = '';
    }
  }
  
  if (currentGroup) {
    // If the name ends with a prefix (unlikely, but possible malformed data), append it
    groupedParts.push(currentGroup);
  }
  
  let nombres = '';
  let ape1 = '';
  let ape2 = '';
  
  if (groupedParts.length === 1) {
    nombres = groupedParts[0];
  } else if (groupedParts.length === 2) {
    nombres = groupedParts[0];
    ape1 = groupedParts[1];
  } else if (groupedParts.length >= 3) {
    ape2 = groupedParts.pop()!;
    ape1 = groupedParts.pop()!;
    nombres = groupedParts.join(' ');
  }
  
  return { nombres, ape1, ape2 };
}
