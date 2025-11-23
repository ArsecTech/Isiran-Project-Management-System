using AutoMapper;
using Isiran.Application.Common.Models;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Resources.Queries;

public class GetResourceListQueryHandler : IRequestHandler<GetResourceListQuery, PagedResult<GetResourceListDto>>
{
    private readonly IRepository<Domain.Resources.Resource> _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<GetResourceListQueryHandler> _logger;

    public GetResourceListQueryHandler(
        IRepository<Domain.Resources.Resource> repository,
        IMapper mapper,
        ILogger<GetResourceListQueryHandler> logger)
    {
        _repository = repository;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<PagedResult<GetResourceListDto>> Handle(GetResourceListQuery request, CancellationToken cancellationToken)
    {
        var resources = await _repository.FindAsync(r =>
            !r.IsDeleted &&
            (string.IsNullOrEmpty(request.SearchTerm) ||
             r.FirstName.Contains(request.SearchTerm) ||
             r.LastName.Contains(request.SearchTerm) ||
             r.Email.Contains(request.SearchTerm)) &&
            (!request.Type.HasValue || r.Type == request.Type.Value) &&
            (!request.Status.HasValue || r.Status == request.Status.Value),
            cancellationToken);

        var totalCount = resources.Count();
        var pagedResources = resources
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var dtos = _mapper.Map<List<GetResourceListDto>>(pagedResources);

        return new PagedResult<GetResourceListDto>(dtos, totalCount, request.PageNumber, request.PageSize);
    }
}

