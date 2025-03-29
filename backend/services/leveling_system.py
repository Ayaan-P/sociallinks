# Defines the leveling system logic based on XP thresholds.

XP_THRESHOLDS = {
    1: 0,
    2: 5,
    3: 12,
    4: 22,
    5: 36,
    6: 54,
    7: 78,
    8: 108,
    9: 145,
    10: 190
}
MAX_LEVEL = 10

def calculate_level(total_xp):
    """
    Calculates the relationship level based on the total accumulated XP.

    Args:
        total_xp (int): The total experience points earned.

    Returns:
        int: The calculated level (1-10).
    """
    current_level = 1
    # Iterate through levels 2 to MAX_LEVEL to find the correct level
    for level in range(2, MAX_LEVEL + 1):
        if total_xp >= XP_THRESHOLDS[level]:
            current_level = level
        else:
            # Stop checking once the XP threshold for the next level is not met
            break
    return current_level

def get_xp_for_next_level(current_level):
    """
    Gets the total XP required to reach the next level.

    Args:
        current_level (int): The current level.

    Returns:
        int or None: The total XP needed for the next level, or None if already at max level.
    """
    if current_level >= MAX_LEVEL:
        return None
    next_level = current_level + 1
    return XP_THRESHOLDS.get(next_level)

def get_xp_progress_in_level(total_xp, current_level):
    """
    Calculates the XP earned within the current level towards the next level.

    Args:
        total_xp (int): The total accumulated XP.
        current_level (int): The current level.

    Returns:
        tuple(int, int): A tuple containing (xp_earned_in_level, xp_needed_for_next_level_from_start_of_current).
                         Returns (0, 0) if at max level.
    """
    if current_level >= MAX_LEVEL:
        return 0, 0 # No progress needed at max level

    xp_at_start_of_current_level = XP_THRESHOLDS.get(current_level, 0)
    xp_at_start_of_next_level = XP_THRESHOLDS.get(current_level + 1, 0)

    xp_earned_in_level = total_xp - xp_at_start_of_current_level
    xp_needed_for_next_level_from_start_of_current = xp_at_start_of_next_level - xp_at_start_of_current_level

    # Ensure earned XP doesn't exceed the amount needed for the level
    xp_earned_in_level = max(0, min(xp_earned_in_level, xp_needed_for_next_level_from_start_of_current))

    return xp_earned_in_level, xp_needed_for_next_level_from_start_of_current
