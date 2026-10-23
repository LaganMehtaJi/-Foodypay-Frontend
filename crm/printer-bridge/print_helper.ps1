param(
    [string]$PrinterName = "Microsoft Print to PDF",
    [string]$TextContent = "",
    [string]$TextFile = "",
    [int]$WidthMm = 80,
    [string]$AutoCut = "true"
)

try {
    Add-Type -AssemblyName System.Drawing
    Add-Type -AssemblyName System.Windows.Forms

    $doc = New-Object System.Drawing.Printing.PrintDocument
    $doc.PrinterSettings.PrinterName = $PrinterName

    # StandardPrintController ensures NO Windows printing status/dialog box ever pops up!
    $doc.PrintController = New-Object System.Drawing.Printing.StandardPrintController

    if (-not $doc.PrinterSettings.IsValid) {
        Write-Error "Printer '$PrinterName' is not valid or not installed."
        exit 1
    }

    # Set paper size based on mm (80mm ~ 3.15 inch = 315 hundredths of an inch; 58mm ~ 2.28 inch = 228 hundredths)
    $widthInHundredths = if ($WidthMm -eq 58) { 228 } else { 315 }
    $paperSize = New-Object System.Drawing.Printing.PaperSize("Custom", $widthInHundredths, 2000)
    $doc.DefaultPageSettings.PaperSize = $paperSize
    $doc.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(6, 6, 6, 6)

    $rawText = if ($TextFile -and (Test-Path $TextFile)) {
        [System.IO.File]::ReadAllText($TextFile, [System.Text.Encoding]::UTF8)
    } else {
        $TextContent
    }

    $lines = $rawText -split "\r?\n"

    $printAction = {
        param($sender, $ev)
        $g = $ev.Graphics
        $fontRegular = New-Object System.Drawing.Font("Segoe UI", 9.0, [System.Drawing.FontStyle]::Regular)
        $fontBold = New-Object System.Drawing.Font("Segoe UI", 9.5, [System.Drawing.FontStyle]::Bold)
        $fontTitle = New-Object System.Drawing.Font("Segoe UI", 12.0, [System.Drawing.FontStyle]::Bold)
        $brush = [System.Drawing.Brushes]::Black

        $y = 10
        $left = 8
        $printWidth = $ev.MarginBounds.Width

        foreach ($line in $lines) {
            $f = $fontRegular
            $lineTrim = $line.Trim()

            if ($lineTrim.StartsWith("===") -or $lineTrim.StartsWith("---")) {
                $f = $fontRegular
            } elseif ($lineTrim -eq "KOT" -or $lineTrim.StartsWith("TOTAL:") -or $lineTrim -eq "PAID" -or $lineTrim -eq "KOT TEST") {
                $f = $fontTitle
            } elseif ($lineTrim.StartsWith("Table:") -or $lineTrim.StartsWith("Bill #:") -or $lineTrim.StartsWith("Item")) {
                $f = $fontBold
            }

            $stringFormat = New-Object System.Drawing.StringFormat
            if ($line.StartsWith("     ") -or $lineTrim -eq "KOT" -or $lineTrim -eq "KOT TEST" -or $lineTrim -eq "PAID" -or $lineTrim.StartsWith("Thank you") -or $lineTrim.StartsWith("SNACK RACK")) {
                $stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
                $rect = New-Object System.Drawing.RectangleF($left, $y, $printWidth, 24)
                $g.DrawString($lineTrim, $f, $brush, $rect, $stringFormat)
            } else {
                $g.DrawString($line, $f, $brush, $left, $y)
            }

            $lineHeight = [Math]::Ceiling($f.GetHeight($g)) + 2
            $y += $lineHeight
        }

        $ev.HasMorePages = $false
    }

    $doc.add_PrintPage($printAction)
    
    # Send print job silently
    if ($PrinterName -eq "Microsoft Print to PDF") {
        $pdfPath = Join-Path $env:TEMP ("foodypay_test_" + [Guid]::NewGuid().ToString("N").Substring(0, 8) + ".pdf")
        $doc.PrinterSettings.PrintToFile = $true
        $doc.PrinterSettings.PrintFileName = $pdfPath
        $doc.Print()
        Write-Output "SUCCESS: Printed silently to $pdfPath"
    } else {
        $doc.Print()
        Write-Output "SUCCESS: Printed to $PrinterName"
    }
} catch {
    Write-Error "PRINT_ERROR: $($_.Exception.Message)"
    exit 1
}
