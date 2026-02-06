set dlgResult to display dialog "Enter the exact word to unbold (case-sensitive):" default answer "" buttons {"Cancel", "OK"} default button "OK"
set searchWord to text returned of dlgResult
if searchWord is "" then return

set unboldCount to 0

tell application "Pages"
	activate
	tell front document
		set allWords to every word of body text
		repeat with i from 1 to count of allWords
			set thisWord to item i of allWords
			if contents of thisWord is searchWord then
				set currFont to font of thisWord as text
				if currFont contains "Bold" then
					set newFont to my stripBold(currFont)
					try
						set font of thisWord to newFont
						set unboldCount to unboldCount + 1
					end try
				end if
			end if
		end repeat
	end tell
end tell

display dialog "Unbolded " & unboldCount & " instances of '" & searchWord & "'." buttons {"OK"} default button "OK"

on stripBold(fontName)
	set tid to AppleScript's text item delimiters
	-- Try common bold patterns in PostScript font names
	-- e.g. "Georgia-Bold" -> "Georgia"
	-- e.g. "TimesNewRomanPS-BoldMT" -> "TimesNewRomanPSMT"
	-- e.g. "Helvetica-BoldOblique" -> "Helvetica-Oblique"
	
	set AppleScript's text item delimiters to "-Bold"
	set parts to text items of fontName
	if (count of parts) > 1 then
		set AppleScript's text item delimiters to "-"
		-- Rejoin, but only add dash if there's a suffix after Bold
		set firstPart to item 1 of parts
		set rest to items 2 thru -1 of parts as text
		if rest is "" then
			set result to firstPart
		else
			set result to firstPart & "-" & rest
		end if
		set AppleScript's text item delimiters to tid
		return result
	end if
	
	-- Try just "Bold" without dash (e.g. "HelveticaBold" -> "Helvetica")
	set AppleScript's text item delimiters to "Bold"
	set parts to text items of fontName
	set AppleScript's text item delimiters to ""
	set result to parts as text
	set AppleScript's text item delimiters to tid
	return result
end stripBold
