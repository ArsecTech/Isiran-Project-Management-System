using Isiran.Core.Interfaces;
using Isiran.Domain.Tasks;
using Isiran.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Isiran.Infrastructure.Persistence.Repositories;

public class TaskTimeEntryRepository : Repository<TaskTimeEntry>, IRepository<TaskTimeEntry>
{
    private new readonly ApplicationDbContext _context;

    public TaskTimeEntryRepository(ApplicationDbContext context) : base(context)
    {
        _context = context;
    }

    public new async Task<IEnumerable<TaskTimeEntry>> FindAsync(
        System.Linq.Expressions.Expression<Func<TaskTimeEntry, bool>> predicate,
        CancellationToken cancellationToken = default)
    {
        return await _context.TaskTimeEntries
            .Include(te => te.Task)
            .Include(te => te.Resource)
            .Where(e => !e.IsDeleted)
            .Where(predicate)
            .ToListAsync(cancellationToken);
    }
}

