from decimal import Decimal

ZERO = Decimal("0.00")


def safe_sum(*values):
    """
    This adds the given money values while treating missing values as zero
    It keeps the rest of the backend from repeating the same None checks over and over
    """
    return sum((v or ZERO) for v in values)


def compute_percentage(part: Decimal, whole: Decimal) -> Decimal:
    """
    This turns one value into a percentage of another value
    It returns zero instead of crashing when the whole value is empty or zero
    """
    if not whole or whole == ZERO:
        return ZERO
    return (part / whole) * Decimal("100")


def compute_balance(allocated: Decimal, utilized: Decimal) -> Decimal:
    """
    This gives the remaining balance after subtracting what was already used
    Missing values are treated as zero on either side
    """
    return (allocated or ZERO) - (utilized or ZERO)


def compute_utilization_rate(utilized: Decimal, allocated: Decimal) -> Decimal:
    """
    This is a small wrapper for the utilization percentage calculation
    It keeps that common money formula in one reusable place
    """
    return compute_percentage(utilized, allocated)


def compute_aip_total(ps, mooe, fe, co):
    """
    This adds the four AIP budget parts into one total value
    It is used when the screen or report needs one combined amount
    """
    return safe_sum(ps, mooe, fe, co)


def compute_financial_totals(lines: list):
    """
    This combines a list of expense class rows into one set of grand totals
    Each row is expected to carry the appropriated, allotted, obligated, and disbursed values
    """
    totals = {
        "appropriated": ZERO,
        "allotted": ZERO,
        "obligated": ZERO,
        "disbursed": ZERO,
    }

    # Each line is folded into the running totals so the caller gets one summary object back
    for line in lines:
        totals["appropriated"] += line.get("appropriated", ZERO)
        totals["allotted"] += line.get("allotted", ZERO)
        totals["obligated"] += line.get("obligated", ZERO)
        totals["disbursed"] += line.get("disbursed", ZERO)

    return totals