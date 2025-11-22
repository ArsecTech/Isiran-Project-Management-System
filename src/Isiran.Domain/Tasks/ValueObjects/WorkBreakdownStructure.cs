namespace Isiran.Domain.Tasks.ValueObjects;

public class WorkBreakdownStructure
{
    public string Code { get; private set; } = string.Empty;
    public int Level { get; private set; }

    private WorkBreakdownStructure() { }

    public WorkBreakdownStructure(string code)
    {
        Code = code;
        Level = code.Split('.').Length;
    }

    public static WorkBreakdownStructure GenerateForParent(string? parentCode, int siblingIndex)
    {
        if (string.IsNullOrEmpty(parentCode))
        {
            return new WorkBreakdownStructure((siblingIndex + 1).ToString());
        }

        return new WorkBreakdownStructure($"{parentCode}.{siblingIndex + 1}");
    }

    public override string ToString() => Code;
}

